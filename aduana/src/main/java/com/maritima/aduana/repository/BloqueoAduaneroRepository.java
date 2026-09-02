package com.maritima.aduana.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.maritima.aduana.model.BloqueoAduanero;

@Repository
public interface BloqueoAduaneroRepository extends JpaRepository<BloqueoAduanero, Long> {
    // Devuelve un booleano rápido para saber si un contenedor tiene alerta roja activa
    boolean existsByCodigoContenedorAndEstado(String codigoContenedor, String estado);
    
    Optional<BloqueoAduanero> findByCodigoContenedor(String codigoContenedor);
}