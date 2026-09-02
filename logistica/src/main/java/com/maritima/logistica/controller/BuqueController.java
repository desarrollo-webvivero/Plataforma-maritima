package com.maritima.logistica.controller;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.maritima.logistica.model.Buque;
import com.maritima.logistica.repository.BuqueRepository;

@RestController
@RequestMapping("/api/logistica/buques")
public class BuqueController {

    @Autowired
    private BuqueRepository repository;

    @PostMapping
    public ResponseEntity<Buque> registrarBuque(@RequestBody Buque buque) {
        Buque nuevoBuque = repository.save(buque);
        return ResponseEntity.ok(nuevoBuque);
    }

    @GetMapping
    public List<Buque> listarBuques() {
        return repository.findAll();
    }
}