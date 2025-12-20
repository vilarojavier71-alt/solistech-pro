import { redirect } from 'next/navigation'

/**
 * REDIRECT: Sales Import ? Universal Importer
 * 
 * Esta página redirige automáticamente al Importador Universal
 * con el tipo "sales" preseleccionado
 */
export default function SalesImportRedirect() {
    redirect('/dashboard/import?type=sales')
}
