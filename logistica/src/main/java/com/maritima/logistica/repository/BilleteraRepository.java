package com.maritima.logistica.repository;

import com.maritima.logistica.model.Billetera;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface BilleteraRepository extends JpaRepository<Billetera, Long> {
    // Busca la billetera de un usuario específico
    Optional<Billetera> findByExportadorId(String exportadorId);
}
