import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, MatIcon],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent {
  constructor(private router: Router) {}
  showPassword = false;

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  goToOurProducts(): void {
    this.router.navigate(['/our-products']);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }
}
