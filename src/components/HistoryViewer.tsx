import { useState } from 'react';
import { Calendar, Clock, Download } from 'lucide-react';
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
import * as XLSX from 'xlsx';

interface HistoryViewerProps {
  onGetHistoryByDate: (date: string) => Promise<AttendmentHistory[]>;
}

export const HistoryViewer = ({ onGetHistoryByDate }: HistoryViewerProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showDialog, setShowDialog] = useState(false);
  const [history, setHistory] = useState<AttendmentHistory[]>([]);

  const handleViewHistory = async () => {
    const dayHistory = await onGetHistoryByDate(selectedDate);
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

  const exportToExcel = () => {
    if (history.length === 0) return;

    // Agrupa por atendente e ordena alfabeticamente
    const groupedData = groupByAttendant(history);
    const sortedAttendants = Object.keys(groupedData).sort();

    const exportData = [];
    let currentRow = 1; // Começar da linha 2 (1 indexado, pois linha 1 são os headers)
    
    sortedAttendants.forEach((attendantName, attendantIndex) => {
      const attendmentsByAttendant = groupedData[attendantName]
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      attendmentsByAttendant.forEach((item, index) => {
        exportData.push({
          'Data': selectedDate.split('-').reverse().join('/'),
          'Atendente': index === 0 ? attendantName : '', // Só mostra o nome na primeira linha
          'Número da Ficha': item.ticketNumber,
          'Tipo': item.ticketType === 'preferencial' ? 'Preferencial' : 'Normal',
          'Hora Início': formatTime(item.startTime),
          'Hora Fim': formatTime(item.endTime),
          'Duração (min)': formatDuration(item.startTime, item.endTime).replace(' min', '')
        });
        currentRow++;
      });

      // Adiciona uma linha vazia entre atendentes (exceto o último)
      if (attendantIndex < sortedAttendants.length - 1) {
        exportData.push({
          'Data': '',
          'Atendente': '',
          'Número da Ficha': '',
          'Tipo': '',
          'Hora Início': '',
          'Hora Fim': '',
          'Duração (min)': ''
        });
        currentRow++;
      }
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Define largura das colunas otimizadas
    const colWidths = [
      { wch: 14 }, // Data
      { wch: 25 }, // Atendente  
      { wch: 18 }, // Número da Ficha
      { wch: 15 }, // Tipo
      { wch: 14 }, // Hora Início
      { wch: 14 }, // Hora Fim
      { wch: 16 }  // Duração
    ];
    ws['!cols'] = colWidths;

    // Formatação das células
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;
        
        // Inicializa o estilo da célula
        if (!ws[cellAddress].s) ws[cellAddress].s = {};
        
        // Header row (primeira linha) - vermelho suave
        if (R === 0) {
          ws[cellAddress].s = {
            fill: { fgColor: { rgb: 'FFE6E6' } }, // Vermelho muito suave
            font: { bold: true, color: { rgb: '8B0000' } }, // Texto vermelho escuro
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
              top: { style: 'thin', color: { rgb: 'CCCCCC' } },
              bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
              left: { style: 'thin', color: { rgb: 'CCCCCC' } },
              right: { style: 'thin', color: { rgb: 'CCCCCC' } }
            }
          };
        } 
        // Linhas de dados - alternando branco e rosa muito claro
        else {
          const isEvenRow = R % 2 === 0;
          const isEmpty = !exportData[R - 1] || Object.values(exportData[R - 1]).every(val => val === '');
          
          ws[cellAddress].s = {
            fill: { 
              fgColor: { 
                rgb: isEmpty ? 'FFFFFF' : (isEvenRow ? 'FFFFFF' : 'FFF5F5') 
              } 
            }, // Branco ou rosa muito claro
            font: { color: { rgb: isEmpty ? 'FFFFFF' : '333333' } },
            alignment: { 
              horizontal: C === 1 ? 'left' : 'center', // Nome do atendente à esquerda
              vertical: 'center' 
            },
            border: isEmpty ? undefined : {
              top: { style: 'thin', color: { rgb: 'E5E5E5' } },
              bottom: { style: 'thin', color: { rgb: 'E5E5E5' } },
              left: { style: 'thin', color: { rgb: 'E5E5E5' } },
              right: { style: 'thin', color: { rgb: 'E5E5E5' } }
            }
          };
        }
      }
    }

    // Define altura das linhas
    if (!ws['!rows']) ws['!rows'] = [];
    for (let i = 0; i <= range.e.r; i++) {
      ws['!rows'][i] = { hpt: i === 0 ? 25 : 20 }; // Header mais alto
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Histórico de Atendimentos');
    
    // Nome do arquivo mais descritivo
    const formattedDate = selectedDate.split('-').reverse().join('-');
    XLSX.writeFile(wb, `Historico_Atendimentos_${formattedDate}.xlsx`);
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
        {history.length > 0 && (
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="w-4 h-4 mr-1" />
            Exportar Excel
          </Button>
        )}
      </div>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Histórico de Atendimentos - {selectedDate.split('-').reverse().join('/')}
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

          <div className="flex justify-between pt-4">
            <Button variant="outline" onClick={exportToExcel} disabled={history.length === 0}>
              <Download className="w-4 h-4 mr-1" />
              Exportar Excel
            </Button>
            <Button variant="outline" onClick={() => setShowDialog(false)}>
              Fechar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};