# 🚀 RUTAS API - Sistema de Gestión Social ONG

## 📋 Base URL
```
http://localhost:3000
```

## 🔐 Autenticación

### 1. Login
```
POST /api/auth/login
```
**Descripción:** Obtener token JWT para acceso a rutas protegidas

**Body:**
```json
{
  "usuario": "admin",
  "contraseña": "admin123"
}
```

**Respuesta (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 1,
    "nombre": "admin",
    "correo": "admin@ong.local",
    "rol": "Admin"
  }
}
```

---

## 👥 ROLES

### 2. Listar Roles
```
GET /api/rol
```
**Autenticación:** Requerida (Bearer Token)

**Respuesta (200):**
```json
[
  {
    "id": 1,
    "nombre": "Admin",
    "descripcion": "Administrador del sistema con acceso total"
  },
  {
    "id": 2,
    "nombre": "Usuario",
    "descripcion": "Usuario regular con acceso limitado"
  }
]
```

---

## 💰 DONANTES

### 3. Listar Donantes
```
GET /api/donante
```

### 4. Crear Donante
```
POST /api/donante
```

### 5. Obtener Donante por ID
```
GET /api/donante/{id}
```

### 6. Actualizar Donante
```
PUT /api/donante/{id}
```

### 7. Eliminar Donante
```
DELETE /api/donante/{id}
```

---

## 🎁 DONACIONES

### 8. Listar Donaciones
```
GET /api/donacion
```

### 9. Crear Donación
```
POST /api/donacion
```

### 10. Obtener Donación por ID
```
GET /api/donacion/{id}
```

### 11. Actualizar Donación
```
PUT /api/donacion/{id}
```

### 12. Eliminar Donación
```
DELETE /api/donacion/{id}
```

---

## 👨‍👩‍👧 BENEFICIARIOS

### 13. Listar Beneficiarios
```
GET /api/beneficiario
```

### 14. Crear Beneficiario
```
POST /api/beneficiario
```

### 15. Obtener Beneficiario por ID
```
GET /api/beneficiario/{id}
```

### 16. Actualizar Beneficiario
```
PUT /api/beneficiario/{id}
```

### 17. Eliminar Beneficiario
```
DELETE /api/beneficiario/{id}
```

---

## 👤 USUARIOS

### 18. Listar Usuarios
```
GET /api/usuario
```

### 19. Crear Usuario
```
POST /api/usuario
```

### 20. Obtener Usuario por ID
```
GET /api/usuario/{id}
```

### 21. Actualizar Usuario
```
PUT /api/usuario/{id}
```

### 22. Eliminar Usuario
```
DELETE /api/usuario/{id}
```

---

## 🎯 MISIONES

### 23. Listar Misiones
```
GET /api/mision
```

### 24. Crear Misión
```
POST /api/mision
```

### 25. Obtener Misión por ID
```
GET /api/mision/{id}
```

### 26. Actualizar Misión
```
PUT /api/mision/{id}
```

### 27. Eliminar Misión
```
DELETE /api/mision/{id}
```

---

## 🚗 VEHÍCULOS

### 28. Listar Vehículos
```
GET /api/vehiculo
```

### 29. Crear Vehículo
```
POST /api/vehiculo
```

### 30. Obtener Vehículo por ID
```
GET /api/vehiculo/{id}
```

### 31. Actualizar Vehículo
```
PUT /api/vehiculo/{id}
```

### 32. Eliminar Vehículo
```
DELETE /api/vehiculo/{id}
```

---

## 👨‍🚗 CONDUCTORES

### 33. Listar Conductores
```
GET /api/conductor
```

### 34. Crear Conductor
```
POST /api/conductor
```

### 35. Obtener Conductor por ID
```
GET /api/conductor/{id}
```

### 36. Actualizar Conductor
```
PUT /api/conductor/{id}
```

### 37. Eliminar Conductor
```
DELETE /api/conductor/{id}
```

---

## 📚 DOCUMENTACIÓN INTERACTIVA

```
http://localhost:3000/api-docs
```

Acceso a Swagger UI con todas las rutas documentadas, ejemplos y pruebas interactivas.

---

## 🔑 Usuarios de Prueba

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | admin123 | Admin |
| gestor | admin123 | Usuario |

---

## 📝 Notas Importantes

- **Todas las rutas excepto `/api/auth/login` requieren autenticación**
- Los tokens JWT tienen validez de **24 horas**
- Incluir el token en el header: `Authorization: Bearer {token}`
- La base de datos es **PostgreSQL 12+** en `localhost:5432`
- Base de datos: `gestion_social`

---

## 🛠️ Comandos de Ejecución

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo (backend + frontend)
npm run dev

# Solo backend
npm run backend

# Solo frontend
npm run frontend
```

---

**Versión:** 1.0.0  
**Última actualización:** Abril 15, 2026
