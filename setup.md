# Setup Guide

## Prerequisites

1. **AWS CLI** configured with credentials
2. **kubectl** pointing at the EKS cluster
3. **Argo CD** installed in the cluster
4. **AWS Load Balancer Controller** installed in the cluster

## 1. Create the ECR repository

```bash
aws ecr create-repository --repository-name catalog-api --region sa-east-1
```

## 2. Request a TLS certificate (optional)

```bash
# Request a certificate in ACM
aws acm request-certificate \
  --domain-name "*.dev.example.com" \
  --validation-method DNS \
  --region sa-east-1
```

Replace `CERTIFICATE_ID` in the values.yaml files with the certificate ARN.

## 3. Configure GitHub secrets

In the GitHub repository settings (Secrets and variables > Actions), set:
- Secret `AWS_ROLE_TO_ASSUME`: ARN of the IAM role trusted by GitHub OIDC
- Variable `AWS_ACCOUNT_ID`: your 12-digit account ID
- Variable `AWS_REGION` (optional): defaults to `sa-east-1`

Until `AWS_ACCOUNT_ID` is set, the pipeline only runs lint, tests and a Docker build, so forks stay green.

## 4. Create namespaces

```bash
kubectl create namespace catalog-dev
kubectl create namespace catalog-stage  
kubectl create namespace catalog-prod
```

## 5. Create application secrets

```bash
# Dev
kubectl create secret generic catalog-api-secrets \
  --from-literal=DATABASE_URL="postgresql://user:pass@host:5432/db" \
  --from-literal=REDIS_URL="redis://host:6379" \
  --from-literal=API_USER="catalog" \
  --from-literal=API_PASSWORD="$(openssl rand -base64 24)" \
  -n catalog-dev

# Stage  
kubectl create secret generic catalog-api-secrets \
  --from-literal=DATABASE_URL="postgresql://user:pass@host:5432/db" \
  --from-literal=REDIS_URL="redis://host:6379" \
  --from-literal=API_USER="catalog" \
  --from-literal=API_PASSWORD="$(openssl rand -base64 24)" \
  -n catalog-stage

# Prod
kubectl create secret generic catalog-api-secrets \
  --from-literal=DATABASE_URL="postgresql://user:pass@host:5432/db" \
  --from-literal=REDIS_URL="redis://host:6379" \
  --from-literal=API_USER="catalog" \
  --from-literal=API_PASSWORD="$(openssl rand -base64 24)" \
  -n catalog-prod
```

## 6. Deploy the Argo CD applications

```bash
kubectl apply -f argocd/project-portfolio.yaml
kubectl apply -f argocd/root-app.yaml
```

## 7. Test the API

```bash
# No authentication (health check)
curl https://api.dev.example.com/health

# With basic authentication
curl -u "user:pass" https://api.dev.example.com/products
```

## Environments

- **Dev**: Automatic sync, 2 replicas
- **Stage**: Automatic sync, 3 replicas  
- **Prod**: Manual sync, 5 replicas, PodDisruptionBudget