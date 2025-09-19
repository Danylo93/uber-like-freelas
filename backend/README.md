# 🚀 Marketplace Backend - Docker Setup

Este é o backend FastAPI do marketplace com setup completo usando Docker.

## 📋 Pré-requisitos

- **Docker** (versão 20.10+)
- **Docker Compose** (versão 2.0+)
- **Git** (para clonar o repositório)

## 🚀 Como rodar localmente

### 1. Clonar e acessar o diretório

```bash
# Se ainda não tiver o código
git clone <seu-repositorio>
cd marketplace/backend

# Ou se já tem o código, apenas acesse
cd /caminho/para/seu/projeto/backend
```

### 2. Rodar com Docker Compose

```bash
# Subir todos os serviços (MongoDB, Redis, Backend, Mongo Express)
docker-compose up -d

# Ou para ver os logs em tempo real
docker-compose up
```

### 3. Verificar se está funcionando

```bash
# Verificar se os containers estão rodando
docker-compose ps

# Deve mostrar algo como:
# marketplace-mongodb    Running
# marketplace-redis      Running  
# marketplace-backend    Running
# marketplace-mongo-express Running
```

### 4. Acessar os serviços

- **Backend API**: http://localhost:8001/api/
- **Documentação Swagger**: http://localhost:8001/docs
- **MongoDB Admin** (Mongo Express): http://localhost:8081
  - User: `admin`
  - Password: `admin123`

## 🧪 Testar a API

### Health Check
```bash
curl http://localhost:8001/api/
```

### Criar usuário
```bash
curl -X POST http://localhost:8001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "role": "client"
  }'
```

### Login
```bash
curl -X POST http://localhost:8001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com", 
    "password": "password123"
  }'
```

## 🔧 Comandos úteis

### Ver logs dos serviços
```bash
# Logs de todos os serviços
docker-compose logs -f

# Logs apenas do backend
docker-compose logs -f backend

# Logs apenas do MongoDB
docker-compose logs -f mongodb
```

### Parar os serviços
```bash
# Parar todos os containers
docker-compose down

# Parar e remover volumes (limpa banco de dados)
docker-compose down -v
```

### Rebuild do backend
```bash
# Se você fizer mudanças no código
docker-compose up --build backend
```

### Acessar container do backend
```bash
docker-compose exec backend bash
```

### Resetar o banco de dados
```bash
# Para e remove volumes
docker-compose down -v

# Sobe novamente (vai recriar o banco)
docker-compose up -d
```

## 🗄️ Estrutura dos Serviços

### Backend (Port 8001)
- **FastAPI** com auto-reload
- **Todas as APIs** implementadas:
  - Autenticação (register, login)
  - Usuários (profile, role switch)
  - Serviços (create, list, accept, reject)
  - Chat (messages, conversations)
  - Avaliações (reviews, ratings)
  - Notificações (push notifications)

### MongoDB (Port 27017)
- **Banco principal** com collections:
  - `users` - Usuários (clientes e prestadores)
  - `service_requests` - Solicitações de serviços
  - `service_offers` - Ofertas de prestadores
  - `chats` - Conversas
  - `messages` - Mensagens
  - `reviews` - Avaliações
  - `notifications` - Notificações

### Redis (Port 6379)
- **Cache** para sessões e dados temporários
- **Queue** para processamento assíncrono

### Mongo Express (Port 8081)
- **Interface web** para gerenciar MongoDB
- **Visualizar** dados, collections, documents
- **Executar** queries diretamente

## 🔑 Variáveis de Ambiente

As variáveis estão configuradas no `docker-compose.yml`:

```env
MONGO_URL=mongodb://admin:password123@mongodb:27017/marketplace?authSource=admin
DB_NAME=marketplace  
STRIPE_SECRET_KEY=sk_test_emergent
EMERGENT_LLM_KEY=sk-emergent-fF0F93bB6715b6c590
REDIS_URL=redis://redis:6379
```

## 🐛 Troubleshooting

### Problema: Container não inicia
```bash
# Ver logs detalhados
docker-compose logs backend

# Verificar se as portas estão disponíveis
netstat -tlnp | grep :8001
```

### Problema: Banco não conecta
```bash
# Verificar se MongoDB está rodando
docker-compose exec mongodb mongo --eval "db.adminCommand('ismaster')"

# Verificar logs do MongoDB
docker-compose logs mongodb
```

### Problema: "Permission denied"
```bash
# Dar permissões (Linux/Mac)
sudo chown -R $USER:$USER .
```

### Problema: Mudanças não aparecem
```bash
# Rebuild completo
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 📱 Conectar com Frontend

Para conectar o frontend mobile/web com este backend local:

1. **Altere a URL** no frontend de:
   ```
   https://fastride-2.preview.emergentagent.com/api
   ```
   Para:
   ```
   http://localhost:8001/api
   ```

2. **Configure CORS** se necessário (já está configurado para desenvolvimento)

## 🎯 Próximos Passos

1. ✅ Backend rodando localmente
2. ✅ Banco de dados inicializado
3. ✅ APIs testadas
4. 🔄 Conectar frontend
5. 🔄 Testar fluxo completo
6. 🔄 Deploy em produção

---

**💡 Dica**: Use `docker-compose up -d` para rodar em background e continuar usando o terminal para outros comandos.

**🆘 Precisa de ajuda?** Verifique os logs com `docker-compose logs -f` e veja se há erros específicos.