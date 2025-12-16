# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e8]:
          - img [ref=e10]
          - generic [ref=e12]: SolisTech
        - generic [ref=e13]: Bienvenido
        - generic [ref=e14]: Introduce tus credenciales para acceder
      - generic [ref=e16]:
        - generic [ref=e17]:
          - generic [ref=e18]:
            - generic [ref=e19]: Email
            - textbox "Email" [active] [ref=e20]:
              - /placeholder: tu@email.com
          - generic [ref=e21]:
            - generic [ref=e22]: Contraseña
            - textbox "Contraseña" [ref=e23]:
              - /placeholder: ••••••••
              - text: password123
          - button "Iniciar sesión" [ref=e24]
        - generic [ref=e29]: O continúa con
        - button "Google" [ref=e30]:
          - img
          - text: Google
      - paragraph [ref=e32]:
        - text: ¿No tienes cuenta?
        - link "Regístrate aquí" [ref=e33]:
          - /url: /auth/register
    - paragraph [ref=e35]: © 2025 SolisTech PRO - Gestión Solar Profesional
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e41] [cursor=pointer]:
    - img [ref=e42]
  - alert [ref=e47]
```