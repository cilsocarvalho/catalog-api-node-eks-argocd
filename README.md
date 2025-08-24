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

## 7) Segurança (resumo)
- Dockerfile **não-root** + **HEALTHCHECK** + runtime **read-only** (via chart: `readOnlyRootFilesystem` e `emptyDir:/tmp`).
- Probes (readiness/liveness), **requests/limits**, **HPA** e **PDB**.
- NetworkPolicy básica (ajuste conforme tráfego).
- (Opcional) Kyverno para exigir assinatura Cosign e policies endurecidas.

## Endpoints
- `GET /`      → metadados
- `GET /health`→ saúde
- `GET /products` e `/products/:id`

Pronto! Agora cada commit na `main` atualiza a imagem no ECR, muda o `values.yaml` e o **ArgoCD** faz o deploy no **EKS** automaticamente.
