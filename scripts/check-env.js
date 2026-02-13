#!/usr/bin/env node

/**
 * Script para verificar que todas las variables de entorno necesarias estén configuradas
 */

const requiredPublicVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_API_URL',
];

const requiredPrivateVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_STORAGE_BUCKET',
  'CRON_SECRET',
];

const optionalVars = [
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'USE_FIREBASE_MOCK',
  'NODE_ENV',
];

console.log('🔍 Verificando variables de entorno...\n');

let missingVars = [];
let presentVars = [];

// Verificar variables públicas
console.log('📢 Variables Públicas (NEXT_PUBLIC_*):');
requiredPublicVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`  ✅ ${varName}`);
    presentVars.push(varName);
  } else {
    console.log(`  ❌ ${varName} - FALTANTE`);
    missingVars.push(varName);
  }
});

// Verificar variables privadas
console.log('\n🔒 Variables Privadas (Server-side):');
requiredPrivateVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`  ✅ ${varName}`);
    presentVars.push(varName);
  } else {
    console.log(`  ❌ ${varName} - FALTANTE`);
    missingVars.push(varName);
  }
});

// Verificar variables opcionales
console.log('\n⚙️  Variables Opcionales:');
optionalVars.forEach(varName => {
  if (process.env[varName]) {
    console.log(`  ✅ ${varName} = ${varName === 'FIREBASE_PRIVATE_KEY' ? '***' : process.env[varName]}`);
  } else {
    console.log(`  ⚠️  ${varName} - No configurada (opcional)`);
  }
});

// Resumen
console.log('\n' + '='.repeat(50));
if (missingVars.length === 0) {
  console.log('✅ Todas las variables requeridas están configuradas');
  process.exit(0);
} else {
  console.log(`❌ Faltan ${missingVars.length} variable(s) requerida(s):`);
  missingVars.forEach(v => console.log(`   - ${v}`));
  console.log('\n💡 Consulta docs/ENVIRONMENT_VARIABLES.md para más información');
  process.exit(1);
}
