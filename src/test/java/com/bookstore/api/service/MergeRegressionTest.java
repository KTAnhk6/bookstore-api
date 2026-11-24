package com.bookstore.api.service;

import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.SimpleMailMessage;
import com.bookstore.api.repository.*;
import com.bookstore.api.entity.User;
import com.bookstore.api.service.impl.UserServiceImpl;
import org.springframework.data.domain.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.util.List;

class MergeRegressionTest {
    @Test void fixedCaptchaInputMustBeRejected() {
        assertFalse(new CaptchaService(true).verify("test", "TEST"));
    }
    @Test void captchaUnknownAndMissingInputRejected() {
        CaptchaService service = new CaptchaService(true);
        assertFalse(service.verify(null, null));
        assertFalse(service.verify("unknown", "ABCDE"));
        assertTrue(service.generate().image().startsWith("data:image/png;base64,"));
    }
    @Test void adminSearchPreservesFiltersPagingAndMapsResponse() {
        UserRepository repo = mock(UserRepository.class);
        UserServiceImpl service = new UserServiceImpl(repo, mock(CategoryRepository.class),
            mock(UserFavoriteCategoryRepository.class), mock(PasswordEncoder.class), mock(RefreshTokenService.class));
        Pageable page = PageRequest.of(1, 5, Sort.by("username"));
        User user = User.builder().id(2L).username("alice").role(User.Role.ADMIN).status(User.Status.ACTIVE).build();
        when(repo.searchForAdmin("%alice%", User.Role.ADMIN, User.Status.ACTIVE, page))
            .thenReturn(new PageImpl<>(List.of(user), page, 6));
        var result = service.searchForAdmin(" ALICE ", User.Role.ADMIN, User.Status.ACTIVE, page);
        assertEquals(6, result.getTotalElements());
        assertEquals("alice", result.getContent().getFirst().getUsername());
        verify(repo).searchForAdmin("%alice%", User.Role.ADMIN, User.Status.ACTIVE, page);
    }
    @Test void mailUsesRealSenderInterface() {
        @SuppressWarnings("unchecked") ObjectProvider<JavaMailSender> provider = mock(ObjectProvider.class);
        JavaMailSender sender = mock(JavaMailSender.class);
        when(provider.getIfAvailable()).thenReturn(sender);
        assertTrue(new MailService("sender@example.invalid", "smtp.example.invalid", provider)
            .send("recipient@example.invalid", "reset", "test-body"));
        verify(sender).send(any(SimpleMailMessage.class));
    }
}
