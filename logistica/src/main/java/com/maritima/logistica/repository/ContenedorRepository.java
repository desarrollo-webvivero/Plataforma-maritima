package com.maritima.logistica.repository;

import com.maritima.logistica.model.Contenedor;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ContenedorRepository extends JpaRepository<Contenedor, Long> {

    List<Contenedor> findByCodigoExportador(String codigoExportador);

    boolean existsByCodigo(String codigo);
}
