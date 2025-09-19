#!/bin/bash

# Script para iniciar o backend Docker facilmente

echo "🚀 Iniciando Marketplace Backend com Docker..."

# Verificar se Docker está instalado
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado. Por favor, instale o Docker primeiro."
    exit 1
fi

# Verificar se Docker Compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose não encontrado. Por favor, instale o Docker Compose primeiro."
    exit 1
fi

# Parar containers existentes (se houver)
echo "🛑 Parando containers existentes..."
docker-compose down

# Limpar volumes antigos (opcional - descomente se quiser resetar o banco)
# echo "🗑️ Limpando volumes antigos..."
# docker-compose down -v

# Construir e iniciar os serviços
echo "🔨 Construindo e iniciando serviços..."
docker-compose up --build -d

# Aguardar inicialização
echo "⏳ Aguardando inicialização dos serviços..."
sleep 10

# Verificar status dos containers
echo "📊 Status dos containers:"
docker-compose ps

# Verificar se o backend está respondendo
echo "🧪 Testando backend..."
if curl -f http://localhost:8001/api/ > /dev/null 2>&1; then
    echo "✅ Backend está funcionando!"
    echo ""
    echo "🎉 SUCESSO! Serviços iniciados com sucesso!"
    echo ""
    echo "📡 URLs disponíveis:"
    echo "   🔗 Backend API: http://localhost:8001/api/"
    echo "   📚 Documentação: http://localhost:8001/docs"
    echo "   🗄️ MongoDB Admin: http://localhost:8081 (admin/admin123)"
    echo ""
    echo "🔍 Para ver logs em tempo real:"
    echo "   docker-compose logs -f"
    echo ""
    echo "🛑 Para parar os serviços:"
    echo "   docker-compose down"
else
    echo "❌ Backend não está respondendo. Verificando logs..."
    docker-compose logs backend
fi