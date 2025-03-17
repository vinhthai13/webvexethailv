document.querySelector('.toggle-password').addEventListener('click', function() {
  const passwordInput = document.querySelector('#password');
  const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
  passwordInput.setAttribute('type', type);
  this.classList.toggle('fa-eye');
  this.classList.toggle('fa-eye-slash');
}); 