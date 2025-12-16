-- Permitir a Admins/Owners ver a todos los miembros de su organizacion
CREATE POLICY "users_select_team_policy"
ON users FOR SELECT
USING (
  organization_id IN (
    SELECT organization_id FROM users WHERE id = auth.uid()
  )
);

-- Permitir a Admins/Owners actualizar otros usuarios de su organizacion
CREATE POLICY "users_update_team_policy"
ON users FOR UPDATE
USING (
  -- El usuario que ejecuta la acción es Admin u Owner
  EXISTS (
    SELECT 1 FROM users AS u
    WHERE u.id = auth.uid()
    AND u.organization_id = users.organization_id -- Misma org
    AND u.role IN ('owner', 'admin')
  )
);
