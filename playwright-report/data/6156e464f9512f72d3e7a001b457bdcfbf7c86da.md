# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
            - textbox "Email" [disabled]:
              - /placeholder: tu@email.com
              - text: admin.test@solistech.pro
          - generic [ref=e20]:
            - generic [ref=e21]: Contraseña
            - textbox "Contraseña" [disabled]:
              - /placeholder: ••••••••
              - text: password123
          - button "Iniciando sesión..." [disabled]
        - generic [ref=e26]: O continúa con
        - button "Google" [disabled]:
          - img
          - text: Google
      - paragraph [ref=e28]:
        - text: ¿No tienes cuenta?
        - link "Regístrate aquí" [ref=e29] [cursor=pointer]:
          - /url: /auth/register
    - paragraph [ref=e31]: © 2025 SolisTech PRO - Gestión Solar Profesional
  - region "Notifications alt+T"
  - button "Open Next.js Dev Tools" [ref=e37] [cursor=pointer]:
    - img [ref=e38]
  - alert [ref=e42]
```