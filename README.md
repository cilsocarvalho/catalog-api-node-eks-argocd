# Monorepo — Catalog API + Helm + ArgoCD (GitOps)

Este repositório contém **tudo**: código da API (Node.js/Express), **Dockerfile**, **Helm chart**, diretório **envs/** (valores por ambiente), arquivos do **ArgoCD** (App-of-Apps) e **pipeline CI** que builda a imagem, publica no **ECR** e **atualiza o values** para o Argo sincronizar.

## 1) Rodar local
```bash
make build TAG=dev
make run   TAG=dev   # http://localhost:8080
make test
```

## 2) Preparar Infra (uma vez)
- **ECR**: crie `catalog-api` em `sa-east-1`.
- **ArgoCD**: instale no cluster (`kubectl create ns argocd && kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml`).
- **ALB Controller**: instalado (Ingress class `alb`).
- (Opcional) **External Secrets** + **Kyverno** (pode ser via Argo ou fora).

## 3) Configure o repo
- Substitua `ACCOUNT_ID` em:
  - `charts/catalog-api/values.yaml`
  - `envs/dev/values.yaml`
  - `.github/workflows/ci-gitops.yml`
- Substitua `OWNER/REPO` em:
  - `argocd/apps/catalog-dev.yaml`
  - `argocd/root-app.yaml`

## 4) Bootstrap do ArgoCD
```bash
kubectl apply -f argocd/project-portfolio.yaml
kubectl apply -f argocd/root-app.yaml
```
Isso criará o app `catalog-dev` apontando para `charts/catalog-api` + `envs/dev/values.yaml`.

## 5) CI GitOps (push → EKS)
Crie uma role IAM para OIDC do GitHub com permissões de **push no ECR**. Salve o ARN em `AWS_ROLE_TO_ASSUME` (Secret do GitHub). Ao dar push na `main`:
- a Action builda `ECR_REPO:${{ github.sha }}`,
- faz **push**,
- atualiza `envs/dev/values.yaml` com a nova **tag** e faz commit,
- o ArgoCD sincroniza e entrega no EKS.

## 6) Variar ambientes
Crie `envs/stage/values.yaml` e `envs/prod/values.yaml` e novas `Application`s em `argocd/apps/` apontando para cada uma. O fluxo é o mesmo: commit nos `values` dispara entrega.

## 7) Segurança
- Dockerfile **não-root** + **HEALTHCHECK** + runtime **read-only**
- **Autenticação básica** nos endpoints de produtos
- **TLS/HTTPS** configurado no Ingress com certificado ACM
- **NetworkPolicy restritiva** (apenas tráfego necessário)
- **ArgoCD project** com permissões limitadas
- Probes (startup/readiness/liveness), **requests/limits**, **HPA** e **PDB**
- **Validação de entrada** e tratamento de erros melhorado

## Endpoints
- `GET /`      → metadados (público)
- `GET /health`→ saúde (público)
- `GET /products` → lista produtos (requer auth)
- `GET /products/:id` → produto específico (requer auth)

## Ambientes Configurados
- **Dev**: `envs/dev/values.yaml` - 2 replicas, sync automático
- **Stage**: `envs/stage/values.yaml` - 3 replicas, sync automático  
- **Prod**: `envs/prod/values.yaml` - 5 replicas, sync manual

## Arquivos Adicionados
- `.gitignore`, `.dockerignore`, `.eslintrc.js`
- `setup.md` - guia de configuração detalhado
- Configurações para stage e prod
- Melhorias de segurança e tratamento de erros

Pronto! Agora cada commit na `main` atualiza a imagem no ECR, muda o `values.yaml` e o **ArgoCD** faz o deploy no **EKS** automaticamente.
