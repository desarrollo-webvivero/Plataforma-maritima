package com.maritima.logistica.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.maritima.logistica.model.Licitacion;

@Repository
public interface LicitacionRepository extends JpaRepository<Licitacion, Long> {
    // Método para buscar todas las subastas que estén "ABIERTAS"
    List<Licitacion> findByEstado(String estado);
}