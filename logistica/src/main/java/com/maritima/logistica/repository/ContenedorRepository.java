package com.maritima.logistica.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.maritima.logistica.model.Contenedor;

@Repository
public interface ContenedorRepository extends JpaRepository<Contenedor, Long> {
    // Método personalizado para buscar un contenedor por su código único
    Optional<Contenedor> findByCodigoRegistro(String codigoRegistro);
}