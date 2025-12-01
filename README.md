# Sistema de Gestión de Inventario y Pedidos - Frontend

Frontend desarrollado en React.js para gestión de inventario y pedidos, integrado con backend Spring Boot.

## 🎨 Características

- **Diseño moderno** con paleta de colores beige arena
- **Navegación por pestañas** para Clientes, Artículos y Pedidos
- **CRUD completo** para todas las entidades
- **Interfaz intuitiva** con modales y validaciones
- **Responsive** adaptado a diferentes dispositivos
- **Integración con API REST** del backend Spring Boot

## 📋 Requisitos Previos

- Node.js v16 o superior
- npm o yarn
- Backend Spring Boot corriendo en `http://localhost:8080`

## 🚀 Instalación

### 1. Clonar o descargar el proyecto

```bash
cd inventory-frontend
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar el backend

Asegúrate de que tu backend Spring Boot esté corriendo en el puerto 8080. El proxy está configurado en `vite.config.js`:

```javascript
proxy: {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true,
  }
}
```

### 4. Iniciar el servidor de desarrollo

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:3000`

## 🏗️ Estructura del Proyecto

```
inventory-frontend/
├── src/
│   ├── components/
│   │   ├── ClientesTab.jsx      # Gestión de clientes
│   │   ├── ArticulosTab.jsx     # Gestión de artículos
│   │   └── PedidosTab.jsx       # Gestión de pedidos
│   ├── services/
│   │   └── api.js               # Servicios API REST
│   ├── App.jsx                  # Componente principal
│   ├── main.jsx                 # Punto de entrada
│   └── index.css                # Estilos globales
├── index.html
├── package.json
└── vite.config.js
```

## 🎯 Endpoints del Backend Esperados

### Clientes
- `GET /api/clientes` - Obtener todos los clientes
- `GET /api/clientes/{id}` - Obtener cliente por ID
- `POST /api/clientes` - Crear nuevo cliente
- `PUT /api/clientes/{id}` - Actualizar cliente
- `DELETE /api/clientes/{id}` - Eliminar cliente

### Artículos
- `GET /api/articulos` - Obtener todos los artículos
- `GET /api/articulos/{id}` - Obtener artículo por ID
- `POST /api/articulos` - Crear nuevo artículo
- `PUT /api/articulos/{id}` - Actualizar artículo
- `DELETE /api/articulos/{id}` - Eliminar artículo

### Pedidos
- `GET /api/pedidos` - Obtener todos los pedidos
- `GET /api/pedidos/{id}` - Obtener pedido por ID
- `POST /api/pedidos` - Crear nuevo pedido
- `PUT /api/pedidos/{id}` - Actualizar pedido
- `DELETE /api/pedidos/{id}` - Eliminar pedido

## 📦 Configuración del Backend (Spring Boot)

### 1. Añadir CORS en Spring Boot

Crea una configuración de CORS en tu backend:

```java
@Configuration
public class CorsConfig {
    
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/api/**")
                        .allowedOrigins("http://localhost:3000")
                        .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                        .allowedHeaders("*")
                        .allowCredentials(true);
            }
        };
    }
}
```

### 2. Estructura de DTOs recomendada

#### ClienteDTO
```java
public class ClienteDTO {
    private Long id;
    private String nombreCompleto;
    private String email;
    private String telefono;
    private String direccion;
    private String notas;
}
```

#### ArticuloDTO
```java
public class ArticuloDTO {
    private Long id;
    private String nombre;
    private String precio;
    private String categoria;
}
```

#### PedidoDTO
```java
public class PedidoDTO {
    private Long id;
    private ClienteDTO cliente;
    private String estado;
    private LocalDate fechaPedido;
    private List<PedidoArticuloDTO> items;
}
```

#### PedidoArticuloDTO
```java
public class PedidoArticuloDTO {
    private Long id;
    private ArticuloDTO articulo;
    private Integer cantidad;
    private BigDecimal precioUnitario;
}
```

### 3. Ejemplo de Controller

```java
@RestController
@RequestMapping("/api/clientes")
@CrossOrigin(origins = "http://localhost:3000")
public class ClienteController {
    
    @Autowired
    private ClienteService clienteService;
    
    @GetMapping
    public ResponseEntity<List<ClienteDTO>> getAllClientes() {
        return ResponseEntity.ok(clienteService.findAll());
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ClienteDTO> getClienteById(@PathVariable Long id) {
        return ResponseEntity.ok(clienteService.findById(id));
    }
    
    @PostMapping
    public ResponseEntity<ClienteDTO> createCliente(@RequestBody ClienteDTO clienteDTO) {
        return ResponseEntity.ok(clienteService.save(clienteDTO));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ClienteDTO> updateCliente(
            @PathVariable Long id, 
            @RequestBody ClienteDTO clienteDTO) {
        return ResponseEntity.ok(clienteService.update(id, clienteDTO));
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteCliente(@PathVariable Long id) {
        clienteService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

## 🎨 Paleta de Colores

La aplicación utiliza una paleta de colores beige arena:

- **Primary**: `#D4A574` - Beige arena principal
- **Primary Dark**: `#B8895A` - Variante oscura
- **Primary Light**: `#E6D5B8` - Variante clara
- **Secondary**: `#8B7355` - Marrón secundario
- **Accent**: `#C19A6B` - Color de acento
- **Background**: `#FAF8F3` - Fondo principal

## 🔧 Scripts Disponibles

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview del build
npm run preview

# Linting
npm run lint
```

## 📱 Funcionalidades por Módulo

### Clientes
- Listado completo de clientes
- Crear nuevo cliente
- Editar información del cliente
- Eliminar cliente
- Campos: Nombre, Email, Teléfono, Dirección, Notas

### Artículos
- Listado de artículos con categorías
- Crear nuevo artículo
- Editar artículo existente
- Eliminar artículo
- Campos: Nombre, Precio, Categoría
- Categorías predefinidas: Muebles, Decoración, Iluminación, Textiles, Accesorios, Otros

### Pedidos
- Listado de pedidos con estado y totales
- Crear pedido con múltiples artículos
- Editar pedido existente
- Ver detalles completos del pedido
- Eliminar pedido
- Estados: Pendiente, En Proceso, Completado, Cancelado
- Cálculo automático de totales

## 🐛 Solución de Problemas

### Error de CORS
Si obtienes errores de CORS, verifica:
1. Que el backend tenga la configuración de CORS correcta
2. Que el backend esté corriendo en `http://localhost:8080`
3. Que el frontend esté corriendo en `http://localhost:3000`

### Error de conexión con el backend
1. Verifica que el backend esté corriendo
2. Comprueba la configuración del proxy en `vite.config.js`
3. Revisa la consola del navegador para más detalles

### Problemas con dependencias
```bash
# Eliminar node_modules y reinstalar
rm -rf node_modules
rm package-lock.json
npm install
```

## 📄 Licencia

Este proyecto es de código abierto.

## 👨‍💻 Desarrollo

Desarrollado con:
- React 18
- Vite
- Axios
- Lucide React (iconos)

---

**¿Necesitas ayuda?** Revisa la consola del navegador y los logs del backend para identificar errores.
