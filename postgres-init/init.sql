-- 1. Crear los entornos físicos
CREATE DATABASE iam_fin_db;
CREATE DATABASE logistica_db;
CREATE DATABASE aduana_db;

-- =========================================================================
-- 2. BASE DE DATOS: IAM Y FINANZAS (iam_fin_db)
-- =========================================================================
\c iam_fin_db;

-- Controla el acceso, credenciales de inicio de sesión y el rol de cada usuario dentro de la plataforma.
CREATE TABLE usuarios (
    usuario_id BIGSERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_usuario VARCHAR(255) NOT NULL,
    rol VARCHAR(50) NOT NULL,
    estado_cuenta VARCHAR(20) DEFAULT 'ACTIVO',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion_password TIMESTAMP
);

-- Representa el monedero virtual; administra los créditos disponibles para pujar y los fondos retenidos en subastas.
CREATE TABLE billeteras (
    billetera_id BIGSERIAL PRIMARY KEY,
    usuario_id BIGINT UNIQUE REFERENCES usuarios(usuario_id) ON DELETE CASCADE,
    saldo_tokens NUMERIC(12,2) DEFAULT 0.00,
    fondos_bloqueados NUMERIC(12,2) DEFAULT 0.00,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Registro financiero inmutable que almacena el detalle y estado de cada recarga o pago de tokens.
CREATE TABLE transacciones_token (
    transaccion_id BIGSERIAL PRIMARY KEY,
    billetera_id BIGINT REFERENCES billeteras(billetera_id) ON DELETE CASCADE,
    tipo_transaccion VARCHAR(50) NOT NULL,
    monto NUMERIC(12,2) NOT NULL,
    estado VARCHAR(20) NOT NULL,
    fecha_transaccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================================
-- 3. BASE DE DATOS: LOGÍSTICA (logistica_db) 
-- =========================================================================
\c logistica_db;

-- Representa las ubicaciones físicas en el puerto para gestionar atracos, descansos de carga y salidas (Gate-out).
CREATE TABLE muelles (
    muelle_id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    estado_disponibilidad VARCHAR(50) DEFAULT 'DISPONIBLE',
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_por BIGINT 
);

-- Registra los barcos de las navieras y su capacidad máxima de carga en TEUs.
CREATE TABLE buques (
    buque_id BIGSERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    matricula VARCHAR(50) UNIQUE NOT NULL,
    capacidad_maxima_teus INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Guarda la información comercial de las subastas de rutas y espacios ofrecidos por los buques.
CREATE TABLE licitaciones (
    licitacion_id BIGSERIAL PRIMARY KEY,
    buque_id BIGINT NOT NULL,
    ruta VARCHAR(255) NOT NULL,
    puerto_origen VARCHAR(100) NOT NULL,
    puerto_destino VARCHAR(100) NOT NULL,
    estado VARCHAR(50) NOT NULL, 
    precio_base DECIMAL(12, 2) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_por BIGINT, 
    FOREIGN KEY (buque_id) REFERENCES buques(buque_id)
);

-- Bitácora inmutable de auditoría que registra cada cambio de estado de las licitaciones (ej. ABIERTA a ADJUDICADA).
CREATE TABLE historial_licitaciones (
    historial_id BIGSERIAL PRIMARY KEY,
    licitacion_id BIGINT NOT NULL,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50) NOT NULL,
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cambiado_por BIGINT NOT NULL, 
    FOREIGN KEY (licitacion_id) REFERENCES licitaciones(licitacion_id) ON DELETE CASCADE
);

-- Tabla base que almacena la información general y la ubicación física aplicable a cualquier tipo de contenedor.
CREATE TABLE contenedores (
    contenedor_id BIGSERIAL PRIMARY KEY,
    buque_id BIGINT,
    muelle_id BIGINT,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    peso DECIMAL(10, 2) NOT NULL,
    estado VARCHAR(50) NOT NULL, 
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_por BIGINT, 
    FOREIGN KEY (buque_id) REFERENCES buques(buque_id),
    FOREIGN KEY (muelle_id) REFERENCES muelles(muelle_id)
);

-- Bitácora inmutable que rastrea los movimientos físicos de muelle a buque y los cambios de estado del contenedor.
CREATE TABLE historial_contenedores (
    historial_id BIGSERIAL PRIMARY KEY,
    contenedor_id BIGINT NOT NULL,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50) NOT NULL,
    muelle_id_anterior BIGINT,
    muelle_id_nuevo BIGINT,
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cambiado_por BIGINT NOT NULL, 
    FOREIGN KEY (contenedor_id) REFERENCES contenedores(contenedor_id) ON DELETE CASCADE
);

-- Tabla de especialización para registrar atributos exclusivos de la carga estándar.
CREATE TABLE carga_seca (
    contenedor_id BIGINT PRIMARY KEY,
    tipo_embalaje VARCHAR(100),
    es_apilable BOOLEAN,
    FOREIGN KEY (contenedor_id) REFERENCES contenedores(contenedor_id) ON DELETE CASCADE
);

-- Tabla de especialización para registrar atributos de mercancía que requiere control térmico.
CREATE TABLE carga_refrigerada (
    contenedor_id BIGINT PRIMARY KEY,
    temperatura_requerida DECIMAL(5, 2), 
    requiere_ventilacion BOOLEAN,
    FOREIGN KEY (contenedor_id) REFERENCES contenedores(contenedor_id) ON DELETE CASCADE
);

-- Tabla de especialización para registrar clasificaciones y regulaciones de mercancía de riesgo.
CREATE TABLE carga_peligrosa (
    contenedor_id BIGINT PRIMARY KEY,
    clasificacion_imo VARCHAR(50), 
    instrucciones_manejo TEXT,
    FOREIGN KEY (contenedor_id) REFERENCES contenedores(contenedor_id) ON DELETE CASCADE
);

-- Registra de forma permanente las ofertas económicas (pujas) realizadas por los exportadores en las subastas.
CREATE TABLE pujas (
    puja_id BIGSERIAL PRIMARY KEY,
    licitacion_id BIGINT NOT NULL,
    usuario_id BIGINT NOT NULL, 
    monto DECIMAL(12, 2) NOT NULL,
    estado VARCHAR(50) NOT NULL, 
    fecha_puja TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (licitacion_id) REFERENCES licitaciones(licitacion_id) ON DELETE CASCADE
);

-- =========================================================================
-- 4. BASE DE DATOS: ADUANAS (aduana_db)
-- =========================================================================
\c aduana_db;

-- Registra la retención legal de un contenedor por parte de las autoridades, impidiendo su embarque.
CREATE TABLE bloqueos_aduaneros (
    bloqueo_id BIGSERIAL PRIMARY KEY,
    contenedor_id BIGINT NOT NULL, 
    inspector_original_id INT,
    motivo TEXT,
    estado VARCHAR(50),
    fecha_bloqueo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_por INT
);

-- Tabla inmutable de auditoría que registra exactamente cuándo un bloqueo cambia de estado y qué oficial lo autorizó.
CREATE TABLE historial_bloqueos (
    historial_id BIGSERIAL PRIMARY KEY,
    bloqueo_id BIGINT REFERENCES bloqueos_aduaneros(bloqueo_id) ON DELETE CASCADE,
    estado_anterior VARCHAR(50),
    estado_nuevo VARCHAR(50),
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    cambiado_por INT
);

-- Documenta los resultados y el veredicto (semáforo) de las revisiones físicas realizadas a la carga retenida.
CREATE TABLE inspecciones_fisicas (
    inspeccion_id BIGSERIAL PRIMARY KEY,
    bloqueo_id BIGINT REFERENCES bloqueos_aduaneros(bloqueo_id) ON DELETE CASCADE,
    inspector_id INT,
    resultado_semaforo VARCHAR(20),
    comentarios TEXT,
    fecha_inspeccion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);