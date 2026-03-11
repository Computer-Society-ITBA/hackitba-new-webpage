#!/bin/bash

# Script para subir variables de entorno a Vercel
# Asegúrate de tener Vercel CLI instalado: npm i -g vercel

echo "🚀 Subiendo variables de entorno a Vercel..."
echo ""

# Verificar que Vercel CLI esté instalado
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI no está instalado."
    echo "📦 Instálalo con: npm i -g vercel"
    exit 1
fi

# Verificar que existe .env.local
if [ ! -f .env.local ]; then
    echo "❌ No se encontró el archivo .env.local"
    echo "💡 Copia .env.local.example y completa los valores:"
    echo "   cp .env.local.example .env.local"
    exit 1
fi

echo "📋 Selecciona el entorno de destino:"
echo "1) Production"
echo "2) Preview"
echo "3) Development"
echo "4) Todos (Production, Preview, Development)"
read -p "Elige una opción (1-4): " choice

case $choice in
    1)
        ENV_FLAGS="production"
        ;;
    2)
        ENV_FLAGS="preview"
        ;;
    3)
        ENV_FLAGS="development"
        ;;
    4)
        ENV_FLAGS="production preview development"
        ;;
    *)
        echo "❌ Opción inválida"
        exit 1
        ;;
esac

echo ""
echo "⚠️  ADVERTENCIA: Este script subirá TODAS las variables de .env.local"
echo "   Asegúrate de que no contenga valores de desarrollo local."
read -p "¿Continuar? (y/n): " confirm

if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "❌ Cancelado"
    exit 0
fi

echo ""
echo "📤 Subiendo variables..."

# Leer el archivo .env.local y subir cada variable
while IFS='=' read -r key value; do
    # Ignorar líneas vacías y comentarios
    if [[ -z "$key" ]] || [[ "$key" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Limpiar espacios en blanco
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    
    if [[ -n "$key" ]] && [[ -n "$value" ]]; then
        echo "  ⬆️  $key"
        
        for env in $ENV_FLAGS; do
            echo "$value" | vercel env add "$key" "$env" --force > /dev/null 2>&1
        done
    fi
done < .env.local

echo ""
echo "✅ Variables subidas exitosamente!"
echo "💡 Ahora necesitas hacer un redeploy para que los cambios tomen efecto:"
echo "   vercel --prod"
