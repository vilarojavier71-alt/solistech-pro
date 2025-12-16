-- Actualizar Check Constraint para incluir 'canvasser' (El Pica)

ALTER TABLE users 
DROP CONSTRAINT IF EXISTS users_role_check;

ALTER TABLE users 
ADD CONSTRAINT users_role_check 
CHECK (role IN ('owner', 'admin', 'commercial', 'engineer', 'installer', 'canvasser', 'user'));
