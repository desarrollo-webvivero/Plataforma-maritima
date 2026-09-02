package com.maritima.logistica.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.maritima.logistica.model.Buque;

@Repository
public interface BuqueRepository extends JpaRepository<Buque, Long> {
    // Spring crea automáticamente métodos como save(), findAll(), findById()
}