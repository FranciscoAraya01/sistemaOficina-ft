# Cambios Requeridos en el Backend

## Resumen de Cambios Implementados en Frontend

El frontend ha sido actualizado para incluir:

1. **Campo Sucursales** en clientes (múltiples sucursales por cliente)
2. **Estado de Pedidos** automáticamente "Pendiente" al crear
3. **Botón "Actualizar Estado"** en el modal de detalles (opciones: "En Proceso", "Despachado")
4. **Nueva columna de Prioridad** en tabla de pedidos (calculada automáticamente basada en fecha)

---

## 1. Modelo Cliente - ACTUALIZAR

### Agregar campo `sucursales` a la tabla `clientes`:

```sql
-- Opción 1: Si usas campo JSON (MySQL 5.7+, PostgreSQL)
ALTER TABLE clientes ADD COLUMN sucursales JSON DEFAULT '[]';

-- Opción 2: Si prefieres relación One-to-Many (recomendado para escalabilidad)
CREATE TABLE sucursales (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  cliente_id BIGINT NOT NULL,
  nombre VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
);

-- Luego agregar índice
CREATE INDEX idx_sucursales_cliente ON sucursales(cliente_id);
```

### Actualizar Entidad `Cliente.java`:

**Opción A: JSON Array (Simple)**
```java
@Entity
@Table(name = "clientes")
public class Cliente {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String nombreCompleto;
    private String email;
    private String telefono;
    private String direccion;
    private String notas;
    
    @Column(columnDefinition = "JSON")
    private List<String> sucursales = new ArrayList<>();
    
    // Getters y Setters
}
```

**Opción B: One-to-Many Relationship (Escalable)**
```java
@Entity
@Table(name = "clientes")
public class Cliente {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String nombreCompleto;
    private String email;
    private String telefono;
    private String direccion;
    private String notas;
    
    @OneToMany(mappedBy = "cliente", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Sucursal> sucursales = new ArrayList<>();
    
    // Getters y Setters
}

@Entity
@Table(name = "sucursales")
public class Sucursal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String nombre;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    private Cliente cliente;
    
    // Getters y Setters
}
```

---

## 2. Modelo Pedido - ACTUALIZAR

### Agregar campo `sucursalId` a la tabla `pedidos`:

```sql
ALTER TABLE pedidos ADD COLUMN sucursal_id VARCHAR(255) DEFAULT NULL;
```

### Actualizar Entidad `Pedido.java`:

```java
@Entity
@Table(name = "pedidos")
public class Pedido {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private Long clienteId;
    private String sucursalId;  // ✨ NUEVO
    private String estado;      // "Pendiente", "En Proceso", "Despachado"
    private LocalDate fechaPedido;
    
    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    @JoinColumn(name = "pedido_id")
    private List<ItemPedido> items;
    
    // Getters y Setters
}
```

---

## 3. DTO Pedido - ACTUALIZAR

### Modificar `PedidoDTO.java` o `CreatePedidoRequest.java`:

```java
public class PedidoDTO {
    private Long id;
    private Long clienteId;
    private String sucursalId;    // ✨ NUEVO
    private String estado;
    private LocalDate fechaPedido;
    private List<ItemPedidoDTO> items;
    private String prioridad;     // Calculado
    
    // Getter para prioridad (ya implementado en frontend)
    public String getPrioridad() {
        if (this.fechaPedido == null) return "baja";
        
        long diasTranscurridos = ChronoUnit.DAYS.between(
            this.fechaPedido,
            LocalDate.now()
        );
        
        if (diasTranscurridos > 10) return "alta";
        if (diasTranscurridos >= 7) return "media";
        return "baja";
    }
    
    // Getters y Setters
}
```

---

## 4. Validación en Backend

### Agregar validación de estados permitidos:

```java
@Entity
@Table(name = "pedidos")
public class Pedido {
    // ...
    
    @Enumerated(EnumType.STRING)
    private EstadoPedido estado;
    
    // ...
}

public enum EstadoPedido {
    PENDIENTE("Pendiente"),
    EN_PROCESO("En Proceso"),
    DESPACHADO("Despachado"),
    COMPLETADO("Completado"),
    CANCELADO("Cancelado");
    
    private final String displayName;
    
    EstadoPedido(String displayName) {
        this.displayName = displayName;
    }
    
    public String getDisplayName() {
        return displayName;
    }
}
```

---

## 5. Servicio de Pedidos - ACTUALIZAR

### `PedidoService.java`:

```java
@Service
public class PedidoService {
    
    @Autowired
    private PedidoRepository pedidoRepository;
    
    public Pedido crear(CreatePedidoRequest request) {
        Pedido pedido = new Pedido();
        pedido.setClienteId(request.getClienteId());
        pedido.setSucursalId(request.getSucursalId());
        pedido.setEstado("Pendiente");  // ✨ AUTO-ASIGNAR AL CREAR
        pedido.setFechaPedido(request.getFechaPedido());
        pedido.setItems(request.getItems());
        
        return pedidoRepository.save(pedido);
    }
    
    public Pedido actualizar(Long id, UpdatePedidoRequest request) {
        Pedido pedido = pedidoRepository.findById(id)
            .orElseThrow(() -> new NotFoundException("Pedido no encontrado"));
        
        // Validar transición de estado
        String estadoActual = pedido.getEstado();
        String nuevoEstado = request.getEstado();
        
        // Solo permitir ciertos cambios de estado
        if ("Pendiente".equals(estadoActual)) {
            if (!("En Proceso".equals(nuevoEstado) || 
                  "Cancelado".equals(nuevoEstado))) {
                throw new BadRequestException(
                    "No se puede cambiar de Pendiente a " + nuevoEstado
                );
            }
        }
        
        pedido.setSucursalId(request.getSucursalId());
        pedido.setEstado(nuevoEstado);
        
        return pedidoRepository.save(pedido);
    }
}
```

---

## 6. Controlador - ACTUALIZAR

### `PedidoController.java`:

```java
@RestController
@RequestMapping("/api/pedidos")
public class PedidoController {
    
    @Autowired
    private PedidoService pedidoService;
    
    @PostMapping
    public ResponseEntity<PedidoDTO> crear(@RequestBody CreatePedidoRequest request) {
        Pedido pedido = pedidoService.crear(request);
        return ResponseEntity.ok(convertToDTO(pedido));
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<PedidoDTO> actualizar(
        @PathVariable Long id,
        @RequestBody UpdatePedidoRequest request
    ) {
        Pedido pedido = pedidoService.actualizar(id, request);
        return ResponseEntity.ok(convertToDTO(pedido));
    }
    
    @GetMapping
    public ResponseEntity<List<PedidoDTO>> listar() {
        List<Pedido> pedidos = pedidoService.listar();
        return ResponseEntity.ok(
            pedidos.stream()
                .map(this::convertToDTO)
                .collect(Collectors.toList())
        );
    }
    
    private PedidoDTO convertToDTO(Pedido pedido) {
        PedidoDTO dto = new PedidoDTO();
        dto.setId(pedido.getId());
        dto.setClienteId(pedido.getClienteId());
        dto.setSucursalId(pedido.getSucursalId());  // ✨ NUEVO
        dto.setEstado(pedido.getEstado());
        dto.setFechaPedido(pedido.getFechaPedido());
        dto.setItems(convertItems(pedido.getItems()));
        return dto;
    }
}
```

---

## 7. Cambios en Respuestas JSON

### Respuesta GET `/api/clientes/{id}` (ANTES):
```json
{
  "id": 1,
  "nombreCompleto": "Juan Pérez",
  "email": "juan@example.com",
  "telefono": "2222-1111",
  "direccion": "Calle Principal 123",
  "notas": "Cliente importante"
}
```

### Respuesta GET `/api/clientes/{id}` (DESPUÉS):
```json
{
  "id": 1,
  "nombreCompleto": "Juan Pérez",
  "email": "juan@example.com",
  "telefono": "2222-1111",
  "direccion": "Calle Principal 123",
  "notas": "Cliente importante",
  "sucursales": ["Sucursal Central", "Sucursal Este", "Sucursal Oeste"]
}
```

### Respuesta GET `/api/pedidos` (ANTES):
```json
{
  "id": 1,
  "clienteId": 1,
  "estado": "Pendiente",
  "fechaPedido": "2025-11-21",
  "items": [...]
}
```

### Respuesta GET `/api/pedidos` (DESPUÉS):
```json
{
  "id": 1,
  "clienteId": 1,
  "sucursalId": "Sucursal Central",
  "estado": "Pendiente",
  "fechaPedido": "2025-11-21",
  "prioridad": "baja",
  "items": [...]
}
```

---

## 8. Migración de Datos (si necesario)

```sql
-- Si ya tienes pedidos existentes, asegúrate de llenarlos con estado por defecto
UPDATE pedidos SET estado = 'Pendiente' WHERE estado IS NULL;

-- Agregar restricción NOT NULL si es necesario
ALTER TABLE pedidos MODIFY COLUMN estado VARCHAR(50) NOT NULL DEFAULT 'Pendiente';
```

---

## 9. Testing - Casos de Prueba

```bash
# Test: Crear pedido (estado debe ser auto-asignado a "Pendiente")
POST /api/pedidos
{
  "clienteId": 1,
  "sucursalId": "Sucursal Central",
  "fechaPedido": "2025-11-21",
  "items": [...]
}
# Response: estado = "Pendiente" ✅

# Test: Cambiar estado de pedido
PUT /api/pedidos/1
{
  "clienteId": 1,
  "sucursalId": "Sucursal Central",
  "estado": "En Proceso",
  "fechaPedido": "2025-11-21",
  "items": [...]
}
# Response: estado = "En Proceso" ✅

# Test: Verificar sucursales del cliente
GET /api/clientes/1
# Response incluye: "sucursales": ["Sucursal Central", "Sucursal Este"]
```

---

## 10. Checklist de Implementación

- [ ] Agregar columna `sucursales` a tabla `clientes`
- [ ] Actualizar entidad `Cliente` con campo sucursales
- [ ] Agregar columna `sucursal_id` a tabla `pedidos`
- [ ] Actualizar entidad `Pedido` con campo sucursalId
- [ ] Crear DTO para sucursales (si aplica)
- [ ] Modificar endpoint POST `/api/pedidos` para auto-asignar estado "Pendiente"
- [ ] Agregar validación de cambios de estado en servicio
- [ ] Actualizar respuestas JSON en controladores
- [ ] Ejecutar tests de integración
- [ ] Verificar que el frontend reciba correctamente sucursales y estados

---

## Preguntas Frecuentes

**P: ¿Es necesario persistir "prioridad" en la BD?**
A: No, se calcula en tiempo real basado en `fechaPedido`. El frontend y backend lo calculan dinámicamente.

**P: ¿Puedo cambiar de cualquier estado a cualquier otro?**
A: Recomendado agregar validación de transiciones (ej: solo Pendiente → En Proceso, no Completado → Pendiente).

**P: ¿Cómo manejar sucursales si el cliente no tiene ninguna?**
A: El campo será un array vacío `[]` en JSON, o lista vacía en Java. El dropdown se deshabilitará en el frontend.

**P: ¿Se debe validar que sucursalId corresponda al cliente?**
A: Sí, es recomendable validar en el servicio que la sucursal pertenezca al cliente asignado.

