# Setup Guide

## Pré-requisitos

1. **AWS CLI** configurado com credenciais
2. **kubectl** configurado para o cluster EKS
3. **ArgoCD** instalado no cluster
4. **ALB Controller** instalado no cluster

## 1. Configurar ECR

```bash
aws ecr create-repository --repository-name catalog-api --region us-east-1
```

## 2. Configurar Certificado SSL (opcional)

```bash
# Solicitar certificado no ACM
aws acm request-certificate \
  --domain-name "*.dev.example.com" \
  --validation-method DNS \
  --region sa-east-1
```

Substitua `CERTIFICATE_ID` nos arquivos values.yaml com o ARN do certificado.

## 3. Configurar Secrets do GitHub

No repositório GitHub, configure:
- `AWS_ROLE_TO_ASSUME`: ARN da role IAM para OIDC

## 4. Criar Namespaces

```bash
kubectl create namespace catalog-dev
kubectl create namespace catalog-stage  
kubectl create namespace catalog-prod
```

## 5. Criar Secrets da Aplicação

```bash
# Dev
kubectl create secret generic catalog-api-secrets \
  --from-literal=DATABASE_URL="postgresql://user:pass@host:5432/db" \
  --from-literal=REDIS_URL="redis://host:6379" \
  -n catalog-dev

# Stage  
kubectl create secret generic catalog-api-secrets \
  --from-literal=DATABASE_URL="postgresql://user:pass@host:5432/db" \
  --from-literal=REDIS_URL="redis://host:6379" \
  -n catalog-stage

# Prod
kubectl create secret generic catalog-api-secrets \
  --from-literal=DATABASE_URL="postgresql://user:pass@host:5432/db" \
  --from-literal=REDIS_URL="redis://host:6379" \
  -n catalog-prod
```

## 6. Deploy ArgoCD Applications

```bash
kubectl apply -f argocd/project-portfolio.yaml
kubectl apply -f argocd/root-app.yaml
```

## 7. Testar API

```bash
# Sem autenticação (health check)
curl https://api.dev.example.com/health

# Com autenticação básica
curl -u "user:pass" https://api.dev.example.com/products
```

## Ambientes

- **Dev**: Sync automático, 2 replicas
- **Stage**: Sync automático, 3 replicas  
- **Prod**: Sync manual, 5 replicas, PDB configurado