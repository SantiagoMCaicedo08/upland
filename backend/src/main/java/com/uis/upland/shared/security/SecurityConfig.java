package com.uis.upland.shared.security;

import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

	@Bean
	public SecurityFilterChain securityFilterChain(HttpSecurity http, JwtService jwtService,
			SecurityErrorHandler errorHandler) throws Exception {
		http
				// Sin cookies de sesión no hay nada que un sitio ajeno pueda reutilizar: el
				// token viaja en un header que el navegador no adjunta por su cuenta.
				.csrf(csrf -> csrf.disable())
				.cors(Customizer.withDefaults())
				.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						.requestMatchers("/api/auth/**").permitAll()
						// Va antes que el comodín de abajo: "mios" también encaja en /api/alojamientos/*.
						.requestMatchers(HttpMethod.GET, "/api/alojamientos/mios").authenticated()
						.requestMatchers(HttpMethod.GET, "/api/alojamientos", "/api/alojamientos/*").permitAll()
						.requestMatchers(HttpMethod.POST, "/api/alojamientos").hasRole("ANFITRION")
						.requestMatchers(HttpMethod.GET, "/api/reservas/ocupacion").permitAll()
						.anyRequest().authenticated())
				.exceptionHandling(handling -> handling
						.authenticationEntryPoint(errorHandler)
						.accessDeniedHandler(errorHandler))
				.addFilterBefore(new JwtAuthenticationFilter(jwtService), UsernamePasswordAuthenticationFilter.class);
		return http.build();
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	@Bean
	public CorsConfigurationSource corsConfigurationSource(
			@Value("${upland.cors.origenes-permitidos}") List<String> origenesPermitidos) {
		CorsConfiguration config = new CorsConfiguration();
		config.setAllowedOrigins(origenesPermitidos);
		config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE"));
		// Authorization y Content-Type: application/json no son headers "simples", así que el
		// navegador pregunta primero con un OPTIONS si puede enviarlos.
		config.setAllowedHeaders(List.of("Authorization", "Content-Type"));
		UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
		source.registerCorsConfiguration("/api/**", config);
		return source;
	}

}
