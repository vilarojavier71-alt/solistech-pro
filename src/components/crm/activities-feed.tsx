'use client'

import { Card, CardContent } from "@/components/ui/card"
import { Phone, Mail, Calendar, MessageSquare, CheckCircle2 } from "lucide-react"

export function ActivitiesFeed({ activities }: { activities: any[] }) {
    if (activities.length === 0) {
        return (
            <div className="text-center py-4 text-sm text-zinc-500">
                No hay actividad reciente.
            </div>
        )
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'call': return <Phone className="h-4 w-4 text-blue-400" />
            case 'email': return <Mail className="h-4 w-4 text-purple-400" />
            case 'meeting': return <Calendar className="h-4 w-4 text-amber-400" />
            case 'system': return <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            default: return <MessageSquare className="h-4 w-4 text-zinc-400" />
        }
    }

    return (
        <div className="space-y-0 relative border-l-2 border-zinc-800 ml-3">
            {activities.map((activity, index) => (
                <div key={activity.id} className="mb-6 ml-6 relative">
                    <span className="absolute -left-[31px] top-1 h-6 w-6 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center z-10">
                        {getIcon(activity.type)}
                    </span>
                    <div className="flex flex-col">
                        <span className="text-sm font-medium text-white">{activity.subject}</span>
                        <span className="text-xs text-zinc-500">{new Date(activity.created_at).toLocaleString()}</span>
                        {activity.description && (
                            <p className="text-sm text-zinc-400 mt-1 bg-zinc-800/50 p-2 rounded">
                                {activity.description}
                            </p>
                        )}
                        {activity.user && (
                            <span className="text-xs text-zinc-600 mt-1">
                                Por: {activity.user.full_name}
                            </span>
                        )}
                    </div>
                </div>
            ))}
        </div>
    )
}
