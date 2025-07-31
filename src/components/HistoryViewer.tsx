import { useState } from 'react';
import { Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AttendmentHistory } from '@/types';

interface HistoryViewerProps {
  onGetHistoryByDate: (date: string) => AttendmentHistory[];
}

export const HistoryViewer = ({ onGetHistoryByDate }: HistoryViewerProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDialog, setShowDialog] = useState(false);
  const [history, setHistory] = useState<AttendmentHistory[]>([]);

  const handleViewHistory = () => {
    const dayHistory = onGetHistoryByDate(selectedDate);
    setHistory(dayHistory);
    setShowDialog(true);
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (start: Date, end: Date) => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const minutes = Math.floor(diff / 60000);
    return `${minutes} min`;
  };

  const groupByAttendant = (history: AttendmentHistory[]) => {
    return history.reduce((acc, item) => {
      if (!acc[item.attendantName]) {
        acc[item.attendantName] = [];
      }
      acc[item.attendantName].push(item);
      return acc;
    }, {} as Record<string, AttendmentHistory[]>);
  };

  const groupedHistory = groupByAttendant(history);

  return (
    <>
      <div className="flex items-center gap-2">
        <Input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="w-auto"
        />
        <Button variant="outline" size="sm" onClick={handleViewHistory}>
          <Calendar className="w-4 h-4 mr-1" />
          Ver Histórico
        </Button>
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Histórico de Atendimentos - {new Date(selectedDate).toLocaleDateString('pt-BR')}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {Object.keys(groupedHistory).length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhum atendimento encontrado para esta data.
              </div>
            ) : (
              Object.entries(groupedHistory).map(([attendantName, attendments]) => (
                <div key={attendantName} className="space-y-3">
                  <h3 className="font-semibold text-lg capitalize border-b pb-2">
                    {attendantName} ({attendments.length} atendimentos)
                  </h3>
                  
                  <div className="grid gap-3">
                    {attendments
                      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
                      .map((item) => (
                        <Card key={item.id} className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge variant={item.ticketType === 'preferencial' ? 'default' : 'secondary'}>
                                {item.ticketNumber}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {item.ticketType === 'preferencial' ? 'Preferencial' : 'Normal'}
                              </span>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Início: {formatTime(item.startTime)}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                <span>Fim: {formatTime(item.endTime)}</span>
                              </div>
                              <Badge variant="outline">
                                {formatDuration(item.startTime, item.endTime)}
                              </Badge>
                            </div>
                          </div>
                        </Card>
                      ))
                    }
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};