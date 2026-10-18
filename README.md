**Asunto: Reporte Técnico - Avances de Arquitectura y Configuración del Proyecto Marítimo**

Qué tal equipo, les comparto el detalle técnico de la infraestructura y el código que ya quedó montado en el repositorio para que todos estemos alineados con los requerimientos de la facultad.

**Infraestructura y Aislamiento (Docker)**

* **Orquestación:** Se configuró un `docker-compose.yml` que levanta los servicios de PostgreSQL y Redis (preparando el terreno para la baja latencia de las subastas).
* **Mapeo de Puertos:** Se configuró PostgreSQL en el puerto **5433** (en lugar del tradicional 5432) para evitar conflictos con cualquier instancia de Postgres o pgAdmin que tengan instalada localmente en sus computadoras.
* **Separación de Datos:** El contenedor ejecuta automáticamente un script `init.sql` que crea dos bases de datos lógicamente aisladas: `logistica_db` y `aduana_db`, cumpliendo con la regla de arquitectura estricta.

**Microservicio de Logística (Puerto 8080)**

* **Stack Principal:** Java 21, Spring Boot, Spring Data JPA, integrando dependencias para Redis y WebSockets.
* **Patrón de Base de Datos:** Para los contenedores, utilizamos la estrategia de herencia `@Inheritance(strategy = InheritanceType.SINGLE_TABLE)`. Esto nos permite tener una clase abstracta `Contenedor` y que las clases específicas (`CargaSeca`, `CargaRefrigerada`, `CargaPeligrosa`) se guarden en una sola tabla optimizada en Postgres usando una columna discriminadora.
* **Estructura Relacional:** Se mapearon las entidades de dominio, incluyendo `Buque` (relación One-to-Many con los contenedores) y `Licitacion` (One-to-One).
* **API REST:** Ya está configurado el primer controlador (`BuqueController`) con sus respectivos repositorios JPA para registrar y listar embarcaciones.

**Microservicio de Aduana (Puerto 8082)**

* **Resolución de Conflictos:** El servicio se configuró en el puerto **8082**. Evitamos el 8081 porque suele estar reservado por procesos nativos del sistema en Windows (PID 4), lo que nos iba a dar errores de acceso denegado.
* **Desacoplamiento Absoluto:** Este microservicio apunta únicamente a la bóveda `aduana_db`. La entidad `BloqueoAduanero` no tiene relaciones a nivel de código con las tablas de logística; almacena el identificador del contenedor como un `String`. Si el sistema logístico colapsa por tráfico, aduanas sigue operando.
* **Endpoints de Seguridad:** El `BloqueoAduaneroController` ya expone las rutas para que los agentes emitan alertas rojas y para que el sistema logístico verifique rápidamente el estado de un contenedor.

**Control de Versiones**

* El repositorio está inicializado con un `.gitignore` en la raíz que excluye las configuraciones locales de `.vscode/` y los compilados de Maven para evitar conflictos al hacer *merge*.
* Toda la base de los dos proyectos y la infraestructura de Docker ya está subida a la rama `main`.

Por favor clonen el repositorio, prueben levantar ambos microservicios y avísenme si tienen algún problema con los puertos para revisarlo antes de empezar con los WebSockets.
