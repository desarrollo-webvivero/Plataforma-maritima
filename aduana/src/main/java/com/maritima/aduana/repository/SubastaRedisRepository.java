package com.maritima.aduana.repository;

import com.maritima.aduana.model.SubastaRedis;
import org.springframework.data.repository.CrudRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubastaRedisRepository extends CrudRepository<SubastaRedis, String> {
    
}
