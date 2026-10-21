import ConfirmDialog from './ConfirmDialog';

/** Suspension / activation d'un compte utilisateur (PATCH /api/admin/users/:id/status) */
export default function UserStatusDialog({ user, onConfirm, onClose }) {
  const suspending = user?.is_active;
  return (
    <ConfirmDialog
      open={Boolean(user)}
      title={suspending ? `Suspendre le compte de ${user?.username} ?` : `Activer le compte de ${user?.username} ?`}
      confirmLabel={suspending ? 'Suspendre le compte' : 'Activer le compte'}
      tone={suspending ? 'danger' : 'default'}
      onConfirm={onConfirm}
      onClose={onClose}
    >
      {suspending ? (
        <p>
          {user?.username} ne pourra plus se connecter à Fluxio. Ses données et celles de son
          entreprise restent intactes.
        </p>
      ) : (
        <p>
          {user?.username} pourra se connecter immédiatement, y compris si le code de vérification
          envoyé par email n’a jamais été saisi.
        </p>
      )}
    </ConfirmDialog>
  );
}
