document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const togglePassword = document.querySelector('.toggle-password');
    const passwordInput = document.getElementById('password');
    const notification = document.getElementById('notification');

    // Mostrar/ocultar senha
    togglePassword.addEventListener('click', function() {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.querySelector('i').classList.toggle('fa-eye-slash');
    });

    // Função para mostrar notificação
    function showNotification(message, type = 'success') {
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            ${message}
        `;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 5000);
    }

    // Simulação de login
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;
        const rememberMe = document.querySelector('input[name="remember"]').checked;

        // Validação simples
        if (!username || !password) {
            showNotification('Por favor, preencha todos os campos', 'error');
            return;
        }

        // Simulação de autenticação
        // Em uma aplicação real, você faria uma requisição para um servidor
        if (username === 'admin' && password === 'admin123') {
            showNotification('Login bem-sucedido! Redirecionando...');
            
            // Salvar no localStorage se "Lembrar-me" estiver marcado
            if (rememberMe) {
                localStorage.setItem('rememberMe', 'true');
                localStorage.setItem('username', username);
            } else {
                localStorage.removeItem('rememberMe');
                localStorage.removeItem('username');
            }
            
            // Redirecionar para o dashboard após 2 segundos
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        } else {
            showNotification('Usuário ou senha incorretos', 'error');
        }
    });

    // Preencher usuário se "Lembrar-me" estava marcado
    if (localStorage.getItem('rememberMe') === 'true') {
        const savedUsername = localStorage.getItem('username');
        if (savedUsername) {
            document.getElementById('username').value = savedUsername;
            document.querySelector('input[name="remember"]').checked = true;
        }
    }
});