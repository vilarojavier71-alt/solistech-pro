import { redirect } from 'next/navigation'

/**
 * REDIRECT: Visits Import ? Universal Importer
 * 
 * Esta página redirige automáticamente al Importador Universal
 * con el tipo "visits" preseleccionado
 */
export default function VisitsImportRedirect() {
    redirect('/dashboard/import?type=visits')
}
