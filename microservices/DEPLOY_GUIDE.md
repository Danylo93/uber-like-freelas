# 🚀 Guia de Deploy - Marketplace Microservices

## ✅ Pré-requisitos

### 1. **Cluster Kubernetes**
```bash
# Instalar kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Verificar cluster
kubectl cluster-info
```

### 2. **Helm (Opcional)**
```bash
curl https://baltocdn.com/helm/signing.asc | gpg --dearmor | sudo tee /usr/share/keyrings/helm.gpg > /dev/null
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/helm.gpg] https://baltocdn.com/helm/stable/debian/ all main" | sudo tee /etc/apt/sources/list.d/helm-stable-debian.list
sudo apt-get update
sudo apt-get install helm
```

### 3. **Docker Registry**
- Docker Hub, AWS ECR, ou Google Container Registry
- Fazer login: `docker login`

## 🏗️ Build das Imagens Docker

### 1. **Build dos Microserviços**
```bash
# Auth Service
cd auth-service
docker build -t marketplace/auth-service:latest .
docker push marketplace/auth-service:latest

# User Service  
cd ../user-service
docker build -t marketplace/user-service:latest .
docker push marketplace/user-service:latest

# Service Service
cd ../service-service
docker build -t marketplace/service-service:latest .
docker push marketplace/service-service:latest

# Realtime Service
cd ../realtime-service
docker build -t marketplace/realtime-service:latest .
docker push marketplace/realtime-service:latest

# Notification Service
cd ../notification-service
docker build -t marketplace/notification-service:latest .
docker push marketplace/notification-service:latest

# Payment Service
cd ../payment-service
docker build -t marketplace/payment-service:latest .
docker push marketplace/payment-service:latest

# Chat Service
cd ../chat-service
docker build -t marketplace/chat-service:latest .
docker push marketplace/chat-service:latest

# Analytics Service
cd ../analytics-service
docker build -t marketplace/analytics-service:latest .
docker push marketplace/analytics-service:latest
```

## 🔧 Configuração dos Secrets

### 1. **Criar Secrets**
```bash
# App Secrets
kubectl create secret generic app-secrets \
  --from-literal=mongodb-url="mongodb://admin:password123@mongodb:27017/marketplace?authSource=admin" \
  --from-literal=jwt-secret="your-super-secret-jwt-key-change-this-in-production" \
  --from-literal=stripe-secret="sk_test_your_stripe_secret_key" \
  --namespace=marketplace

# Grafana Secret
kubectl create secret generic grafana-secret \
  --from-literal=admin-password="admin123" \
  --namespace=marketplace

# Firebase Credentials (se usando)
kubectl create secret generic firebase-secret \
  --from-file=credentials.json=./firebase-credentials.json \
  --namespace=marketplace
```

### 2. **Persistent Volumes**
```bash
# Criar PVCs
kubectl apply -f - <<EOF
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: prometheus-pvc
  namespace: marketplace
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 50Gi
---
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: grafana-pvc
  namespace: marketplace
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 10Gi
EOF
```

## 🚀 Deploy Step-by-Step

### 1. **Criar Namespace**
```bash
kubectl apply -f k8s/namespace.yaml
```

### 2. **Deploy Infraestrutura Base**
```bash
# MongoDB Cluster
kubectl apply -f k8s/mongodb.yaml

# Redis
kubectl apply -f k8s/redis.yaml

# Kafka + Zookeeper
kubectl apply -f k8s/kafka.yaml

# Aguardar pods ficarem prontos
kubectl wait --for=condition=ready pod -l app=mongodb -n marketplace --timeout=300s
kubectl wait --for=condition=ready pod -l app=redis -n marketplace --timeout=60s
kubectl wait --for=condition=ready pod -l app=kafka -n marketplace --timeout=300s
```

### 3. **Deploy Microserviços**
```bash
# Auth Service (deve ser primeiro)
kubectl apply -f k8s/auth-service.yaml

# Aguardar Auth Service
kubectl wait --for=condition=ready pod -l app=auth-service -n marketplace --timeout=120s

# Deploy outros serviços
kubectl apply -f k8s/service-service.yaml
kubectl apply -f k8s/realtime-service.yaml

# Deploy serviços restantes (podem ser paralelos)
kubectl apply -f k8s/user-service.yaml
kubectl apply -f k8s/notification-service.yaml
kubectl apply -f k8s/payment-service.yaml
kubectl apply -f k8s/chat-service.yaml
kubectl apply -f k8s/analytics-service.yaml
```

### 4. **Deploy Ingress e Load Balancer**
```bash
# Install NGINX Ingress Controller (se não instalado)
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-v1.8.1/deploy/static/provider/cloud/deploy.yaml

# Deploy Ingress
kubectl apply -f k8s/ingress.yaml
```

### 5. **Deploy Monitoring**
```bash
kubectl apply -f k8s/monitoring.yaml
```

## 🔍 Verificação do Deploy

### 1. **Verificar Pods**
```bash
kubectl get pods -n marketplace -o wide
kubectl get services -n marketplace
kubectl get ingress -n marketplace
```

### 2. **Verificar Logs**
```bash
# Logs de um serviço específico
kubectl logs -f deployment/auth-service -n marketplace

# Logs de todos os pods de um serviço
kubectl logs -f -l app=auth-service -n marketplace
```

### 3. **Health Checks**
```bash
# Port forward para testar localmente
kubectl port-forward service/auth-service 8080:8000 -n marketplace

# Testar endpoint
curl http://localhost:8080/health
```

## 📊 Monitoramento

### 1. **Prometheus**
```bash
# Port forward Prometheus
kubectl port-forward service/prometheus 9090:9090 -n marketplace

# Acessar: http://localhost:9090
```

### 2. **Grafana**
```bash
# Port forward Grafana
kubectl port-forward service/grafana 3000:3000 -n marketplace

# Acessar: http://localhost:3000
# Login: admin / admin123
```

## ⚖️ Scaling

### 1. **Auto Scaling**
```bash
# Verificar HPA
kubectl get hpa -n marketplace

# Escalar manualmente
kubectl scale deployment auth-service --replicas=5 -n marketplace
```

### 2. **Cluster Scaling**
```bash
# Adicionar nós (dependente do provider)
# AWS EKS:
eksctl scale nodegroup --cluster=marketplace --nodes=3 --nodes-max=10 --name=standard-workers

# GKE:
gcloud container clusters resize marketplace --num-nodes=5
```

## 🔄 Updates e Rollbacks

### 1. **Rolling Update**
```bash
# Update de imagem
kubectl set image deployment/auth-service auth-service=marketplace/auth-service:v2.0 -n marketplace

# Verificar rollout
kubectl rollout status deployment/auth-service -n marketplace
```

### 2. **Rollback**
```bash
# Ver histórico
kubectl rollout history deployment/auth-service -n marketplace

# Rollback
kubectl rollout undo deployment/auth-service -n marketplace
```

## 🛡️ Segurança

### 1. **Network Policies**
```bash
kubectl apply -f - <<EOF
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: marketplace-network-policy
  namespace: marketplace
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: marketplace
EOF
```

### 2. **RBAC**
```bash
kubectl apply -f - <<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: marketplace
  name: marketplace-role
rules:
- apiGroups: [""]
  resources: ["pods", "services"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: RoleBinding
metadata:
  name: marketplace-rolebinding
  namespace: marketplace
subjects:
- kind: ServiceAccount
  name: default
  namespace: marketplace
roleRef:
  kind: Role
  name: marketplace-role
  apiGroup: rbac.authorization.k8s.io
EOF
```

## 🚨 Troubleshooting

### 1. **Problemas Comuns**
```bash
# Pod não inicia
kubectl describe pod <pod-name> -n marketplace

# Problemas de network
kubectl exec -it <pod-name> -n marketplace -- nslookup mongodb

# Verificar recursos
kubectl top pods -n marketplace
kubectl top nodes
```

### 2. **Debug Kafka**
```bash
# Listar tópicos
kubectl exec -it kafka-0 -n marketplace -- kafka-topics --bootstrap-server localhost:9092 --list

# Verificar mensagens
kubectl exec -it kafka-0 -n marketplace -- kafka-console-consumer --bootstrap-server localhost:9092 --topic service-requests --from-beginning
```

## 🎯 Performance Tuning

### 1. **JVM Settings** (se usando Java)
```yaml
env:
- name: JAVA_OPTS
  value: "-Xms512m -Xmx1024m -XX:+UseG1GC"
```

### 2. **Resource Limits**
```yaml
resources:
  requests:
    memory: "512Mi"
    cpu: "250m"
  limits:
    memory: "1Gi"
    cpu: "500m"
```

Este guia fornece uma base sólida para deploy em produção do marketplace com microserviços escaláveis usando Kubernetes e Kafka.