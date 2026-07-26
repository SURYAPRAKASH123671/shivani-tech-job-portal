package com.shivanitech.jobportal.service;

import com.shivanitech.jobportal.dto.auth.AuthResponse;
import com.shivanitech.jobportal.dto.auth.LoginRequest;
import com.shivanitech.jobportal.dto.auth.RegisterCandidateRequest;
import com.shivanitech.jobportal.dto.auth.RegisterCompanyRequest;
import com.shivanitech.jobportal.dto.auth.ResendOtpRequest;
import com.shivanitech.jobportal.dto.auth.VerifyOtpRequest;
import com.shivanitech.jobportal.entity.CandidateProfile;
import com.shivanitech.jobportal.entity.Company;
import com.shivanitech.jobportal.entity.CompanyStatus;
import com.shivanitech.jobportal.entity.Role;
import com.shivanitech.jobportal.entity.User;
import com.shivanitech.jobportal.exception.DuplicateResourceException;
import com.shivanitech.jobportal.exception.InvalidOtpException;
import com.shivanitech.jobportal.exception.ResourceNotFoundException;
import com.shivanitech.jobportal.repository.CandidateProfileRepository;
import com.shivanitech.jobportal.repository.CompanyRepository;
import com.shivanitech.jobportal.repository.UserRepository;
import com.shivanitech.jobportal.security.JwtUtil;
import com.shivanitech.jobportal.service.notification.EmailService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CandidateProfileRepository candidateProfileRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final EmailService emailService;

    @Value("${app.otp.expiry-minutes}")
    private long otpExpiryMinutes;

    private static final SecureRandom OTP_RANDOM = new SecureRandom();

    @Transactional
    public AuthResponse registerCandidate(RegisterCandidateRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with this email already exists");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.CANDIDATE)
                .phone(request.getPhone())
                .verified(false)
                .build();
        issueOtp(user);
        user = userRepository.save(user);

        CandidateProfile profile = CandidateProfile.builder()
                .user(user)
                .fullName(request.getFullName())
                .build();
        candidateProfileRepository.save(profile);

        sendOtpEmail(user);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return AuthResponse.builder()
                .token(token).email(user.getEmail()).role(user.getRole().name()).verified(user.isVerified())
                .build();
    }

    @Transactional
    public void verifyOtp(VerifyOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("No account with this email"));

        if (user.isVerified()) {
            return;
        }
        if (user.getOtpCode() == null || user.getOtpExpiresAt() == null
                || user.getOtpExpiresAt().isBefore(LocalDateTime.now())) {
            throw new InvalidOtpException("This code has expired. Request a new one.");
        }
        if (!user.getOtpCode().equals(request.getOtp())) {
            throw new InvalidOtpException("That code doesn't match.");
        }

        user.setVerified(true);
        user.setOtpCode(null);
        user.setOtpExpiresAt(null);
        userRepository.save(user);
    }

    @Transactional
    public void resendOtp(ResendOtpRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new ResourceNotFoundException("No account with this email"));

        if (user.isVerified()) {
            return;
        }
        issueOtp(user);
        userRepository.save(user);
        sendOtpEmail(user);
    }

    private void issueOtp(User user) {
        String otp = String.format("%06d", OTP_RANDOM.nextInt(1_000_000));
        user.setOtpCode(otp);
        user.setOtpExpiresAt(LocalDateTime.now().plusMinutes(otpExpiryMinutes));
    }

    private void sendOtpEmail(User user) {
        emailService.send(
                user.getEmail(),
                "Verify your Shivani Technologies account",
                "Your verification code is " + user.getOtpCode()
                        + ". It expires in " + otpExpiryMinutes + " minutes.");
    }

    @Transactional
    public AuthResponse registerCompany(RegisterCompanyRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new DuplicateResourceException("An account with this email already exists");
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(Role.EMPLOYER)
                .phone(request.getContactPhone())
                .verified(false)
                .build();
        user = userRepository.save(user);

        Company company = Company.builder()
                .user(user)
                .name(request.getCompanyName())
                .contactEmail(request.getContactEmail())
                .contactPhone(request.getContactPhone())
                .status(CompanyStatus.PENDING)
                .build();
        companyRepository.save(company);

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return AuthResponse.builder()
                .token(token).email(user.getEmail()).role(user.getRole().name()).verified(user.isVerified())
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new IllegalStateException("User disappeared after authentication"));

        String token = jwtUtil.generateToken(user.getEmail(), user.getRole().name());
        return AuthResponse.builder()
                .token(token).email(user.getEmail()).role(user.getRole().name()).verified(user.isVerified())
                .build();
    }
}
