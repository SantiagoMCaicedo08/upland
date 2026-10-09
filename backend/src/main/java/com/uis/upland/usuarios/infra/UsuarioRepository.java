package com.uis.upland.usuarios.infra;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.uis.upland.usuarios.domain.Usuario;

public interface UsuarioRepository extends JpaRepository<Usuario, UUID> {

	Optional<Usuario> findByEmail(String email);

	boolean existsByEmail(String email);

}
