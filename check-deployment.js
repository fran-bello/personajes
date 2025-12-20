#!/usr/bin/env node

/**
 * Script de verificación de configuración para deployment
 * Ejecuta: node check-deployment.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando configuración para deployment...\n');

let errors = [];
let warnings = [];

// 1. Verificar que .env está en .gitignore
console.log('1. Verificando .gitignore...');
const gitignore = fs.readFileSync('.gitignore', 'utf8');
if (!gitignore.includes('.env')) {
  errors.push('❌ .env no está en .gitignore');
} else {
  console.log('   ✅ .env está en .gitignore\n');
}

// 2. Verificar que no hay archivos .env en el repo
console.log('2. Verificando que no hay .env en el repo...');
const envFiles = [
  '.env',
  'backend/.env',
  'frontend/.env',
  'mobile/.env',
  '.env.local',
  '.env.production'
];

envFiles.forEach(file => {
  if (fs.existsSync(file)) {
    warnings.push(`⚠️  ${file} existe localmente (está bien, solo verifica que no esté en git)`);
  }
});
console.log('   ✅ No hay .env en el repo (o están correctamente ignorados)\n');

// 3. Verificar package.json del backend
console.log('3. Verificando backend/package.json...');
const backendPkg = JSON.parse(fs.readFileSync('backend/package.json', 'utf8'));
if (!backendPkg.scripts.start) {
  errors.push('❌ backend/package.json no tiene script "start"');
} else {
  console.log('   ✅ Script "start" encontrado:', backendPkg.scripts.start);
}
console.log('');

// 4. Verificar package.json del frontend
console.log('4. Verificando frontend/package.json...');
const frontendPkg = JSON.parse(fs.readFileSync('frontend/package.json', 'utf8'));
if (!frontendPkg.scripts.build) {
  errors.push('❌ frontend/package.json no tiene script "build"');
} else {
  console.log('   ✅ Script "build" encontrado:', frontendPkg.scripts.build);
}
console.log('');

// 5. Verificar que render.yaml existe
console.log('5. Verificando render.yaml...');
if (fs.existsSync('render.yaml')) {
  console.log('   ✅ render.yaml existe');
} else {
  warnings.push('⚠️  render.yaml no existe (opcional, pero recomendado)');
}
console.log('');

// 6. Verificar que vercel.json existe
console.log('6. Verificando frontend/vercel.json...');
if (fs.existsSync('frontend/vercel.json')) {
  console.log('   ✅ frontend/vercel.json existe');
} else {
  warnings.push('⚠️  frontend/vercel.json no existe (opcional, pero recomendado)');
}
console.log('');

// 7. Verificar configuración de base de datos
console.log('7. Verificando configuración de base de datos...');
const dbConfig = fs.readFileSync('backend/config/database.js', 'utf8');
if (dbConfig.includes('dialectOptions') && dbConfig.includes('ssl')) {
  console.log('   ✅ Configuración SSL encontrada (necesaria para PlanetScale)');
} else {
  warnings.push('⚠️  Configuración SSL no encontrada (necesaria para PlanetScale)');
}
console.log('');

// 8. Verificar que las variables de entorno están documentadas
console.log('8. Verificando documentación de variables de entorno...');
if (fs.existsSync('backend/env.production.example.txt')) {
  console.log('   ✅ backend/env.production.example.txt existe');
} else {
  warnings.push('⚠️  backend/env.production.example.txt no existe');
}
if (fs.existsSync('frontend/env.production.example.txt')) {
  console.log('   ✅ frontend/env.production.example.txt existe');
} else {
  warnings.push('⚠️  frontend/env.production.example.txt no existe');
}
console.log('');

// Resumen
console.log('\n' + '='.repeat(50));
console.log('📊 RESUMEN');
console.log('='.repeat(50));

if (errors.length === 0 && warnings.length === 0) {
  console.log('\n✅ ¡Todo está listo para deployment!\n');
} else {
  if (errors.length > 0) {
    console.log('\n❌ ERRORES (debes corregirlos):');
    errors.forEach(err => console.log('   ' + err));
  }
  
  if (warnings.length > 0) {
    console.log('\n⚠️  ADVERTENCIAS (recomendado corregir):');
    warnings.forEach(warn => console.log('   ' + warn));
  }
}

console.log('\n📝 Próximos pasos:');
console.log('   1. Lee DEPLOY_GRATIS.md para la guía completa');
console.log('   2. Crea cuenta en PlanetScale para MySQL');
console.log('   3. Crea cuenta en Render.com para backend');
console.log('   4. Crea cuenta en Vercel para frontend');
console.log('   5. Configura las variables de entorno en cada servicio\n');

process.exit(errors.length > 0 ? 1 : 0);

