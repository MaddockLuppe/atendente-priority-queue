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
import { getAttendanceHistoryByDate } from '@/integrations/supabase/client';

interface HistoryViewerProps {
  onGetHistoryByDate: (date: string) => Promise<AttendmentHistory[]>;
}

export const HistoryViewer = ({ onGetHistoryByDate }: HistoryViewerProps) => {
  // Inicializa com a data atual no formato brasileiro
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toLocaleDateString('pt-BR');
  });
  const [showDialog, setShowDialog] = useState(false);
  const [history, setHistory] = useState<AttendmentHistory[]>([]);

  const handleViewHistory = async () => {
    console.log('🔍 HistoryViewer: Botão "Ver Histórico" clicado');
    console.log('📅 HistoryViewer: Data selecionada:', selectedDate);
    
    if (!isValidDate(selectedDate)) {
      console.log('❌ HistoryViewer: Data inválida:', selectedDate);
      alert('Por favor, insira uma data válida no formato DD/MM/YYYY');
      return;
    }
    
    console.log('✅ HistoryViewer: Data válida, carregando histórico...');
    
    try {
      const { data, error } = await getAttendanceHistoryByDate(selectedDate);
      
      if (error) {
        console.error('❌ Erro ao carregar histórico:', error);
        alert('Erro ao carregar histórico: ' + error.message);
        return;
      }
      
      const mappedHistory: AttendmentHistory[] = (data || []).map(item => ({
        id: item.id,
        attendantId: item.attendant_id,
        attendantName: item.attendant_name,
        ticketNumber: item.ticket_number,
        ticketType: item.ticket_type as 'preferencial' | 'normal',
        startTime: new Date(item.start_time),
        endTime: new Date(item.end_time),
        date: selectedDate,
      }));
      
      // Verificar registros locais pendentes
      try {
        const pendingLocal = JSON.parse(localStorage.getItem('pendingHistoryRecords') || '[]');
        const [day, month, year] = selectedDate.split('/');
        const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        const localForDate = pendingLocal.filter((record: any) => 
          record.service_date === isoDate
        );
        
        if (localForDate.length > 0) {
          console.log('📱 Encontrados', localForDate.length, 'registros locais pendentes');
          
          const localMapped: AttendmentHistory[] = localForDate.map((item: any) => ({
            id: item.id,
            attendantId: item.attendant_id,
            attendantName: item.attendant_name,
            ticketNumber: item.ticket_number,
            ticketType: item.ticket_type as 'preferencial' | 'normal',
            startTime: new Date(item.start_time),
            endTime: new Date(item.end_time),
            date: selectedDate,
          }));
          
          mappedHistory.push(...localMapped);
        }
      } catch (localError) {
        console.log('⚠️ Erro ao verificar registros locais:', localError);
      }
      
      console.log('📋 HistoryViewer: Histórico carregado:', mappedHistory);
      setHistory(mappedHistory);
      setShowDialog(true);
      console.log('🎯 HistoryViewer: Dialog aberto com', mappedHistory.length, 'registros');
    } catch (error) {
      console.error('❌ Erro inesperado:', error);
      alert('Erro inesperado ao carregar histórico');
    }
  };

  // Função para validar e formatar a data brasileira
  const formatBrazilianDate = (value: string) => {
    // Remove caracteres não numéricos
    const numbers = value.replace(/\D/g, '');
    
    // Aplica a máscara DD/MM/YYYY
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 4) {
      return `${numbers.slice(0, 2)}/${numbers.slice(2)}`;
    } else {
      return `${numbers.slice(0, 2)}/${numbers.slice(2, 4)}/${numbers.slice(4, 8)}`;
    }
  };

  // Valida se a data está no formato correto
  const isValidDate = (dateStr: string) => {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    const match = dateStr.match(regex);
    if (!match) return false;
    
    const [, day, month, year] = match;
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.getDate() == parseInt(day) && 
           date.getMonth() == parseInt(month) - 1 && 
           date.getFullYear() == parseInt(year);
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
    
    sortedAttendants.forEach((attendantName, attendantIndex) => {
      const attendmentsByAttendant = groupedData[attendantName]
        .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

      attendmentsByAttendant.forEach((item, index) => {
        exportData.push({
          'Data': selectedDate,
          'Atendente': index === 0 ? attendantName : '', // Só mostra o nome na primeira linha
          'Número da Ficha': item.ticketNumber,
          'Tipo': item.ticketType === 'preferencial' ? 'Preferencial' : 'Normal',
          'Hora Início': formatTime(item.startTime),
          'Hora Fim': formatTime(item.endTime),
          'Duração (min)': formatDuration(item.startTime, item.endTime).replace(' min', '')
        });
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
      }
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Define largura das colunas otimizadas
    const colWidths = [
      { wch: 16 }, // Data
      { wch: 28 }, // Atendente  
      { wch: 20 }, // Número da Ficha
      { wch: 16 }, // Tipo
      { wch: 16 }, // Hora Início
      { wch: 16 }, // Hora Fim
      { wch: 18 }  // Duração
    ];
    ws['!cols'] = colWidths;

    // Aplicar formatação profissional
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');
    
    // Aplicar estilos a cada célula
    for (let R = range.s.r; R <= range.e.r; ++R) {
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        
        if (!ws[cellAddress]) {
          ws[cellAddress] = { t: 's', v: '' };
        }
        
        if (!ws[cellAddress].s) {
          ws[cellAddress].s = {};
        }

        // Cabeçalho - Estilo vermelho profissional
        if (R === 0) {
          ws[cellAddress].s = {
            fill: {
              patternType: 'solid',
              fgColor: { rgb: 'D32F2F' } // Vermelho profissional
            },
            font: {
              name: 'Calibri',
              sz: 12,
              bold: true,
              color: { rgb: 'FFFFFF' } // Texto branco
            },
            alignment: {
              horizontal: 'center',
              vertical: 'center',
              wrapText: true
            },
            border: {
              top: { style: 'medium', color: { rgb: '1976D2' } },
              bottom: { style: 'medium', color: { rgb: '1976D2' } },
              left: { style: 'medium', color: { rgb: '1976D2' } },
              right: { style: 'medium', color: { rgb: '1976D2' } }
            }
          };
        } else {
          // Verifica se é uma linha vazia (separador)
          const dataRow = exportData[R - 1];
          const isEmpty = !dataRow || Object.values(dataRow).every(val => val === '');
          
          if (isEmpty) {
            // Linha separadora invisível
            ws[cellAddress].s = {
              fill: {
                patternType: 'solid',
                fgColor: { rgb: 'F5F5F5' }
              },
              font: {
                name: 'Calibri',
                sz: 10,
                color: { rgb: 'F5F5F5' }
              }
            };
          } else {
            // Linhas de dados com alternância de cores
            const isEvenDataRow = Math.floor((R - 1) / 2) % 2 === 0;
            
            ws[cellAddress].s = {
              fill: {
                patternType: 'solid',
                fgColor: { rgb: isEvenDataRow ? 'FFFFFF' : 'FFEBEE' } // Branco e rosa suave
              },
              font: {
                name: 'Calibri',
                sz: 11,
                color: { rgb: '2E2E2E' },
                bold: C === 1 && dataRow && dataRow['Atendente'] !== '' // Nome do atendente em negrito
              },
              alignment: {
                horizontal: C === 1 ? 'left' : 'center', // Nome à esquerda, resto centralizado
                vertical: 'center'
              },
              border: {
                top: { style: 'thin', color: { rgb: 'E0E0E0' } },
                bottom: { style: 'thin', color: { rgb: 'E0E0E0' } },
                left: { style: 'thin', color: { rgb: 'E0E0E0' } },
                right: { style: 'thin', color: { rgb: 'E0E0E0' } }
              }
            };
          }
        }
      }
    }

    // Define altura das linhas
    ws['!rows'] = [];
    for (let i = 0; i <= range.e.r; i++) {
      if (i === 0) {
        ws['!rows'][i] = { hpt: 30 }; // Cabeçalho mais alto
      } else {
        const dataRow = exportData[i - 1];
        const isEmpty = !dataRow || Object.values(dataRow).every(val => val === '');
        ws['!rows'][i] = { hpt: isEmpty ? 8 : 22 }; // Linha vazia menor
      }
    }

    // Congela a primeira linha (cabeçalho)
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Histórico de Atendimentos');
    
    // Nome do arquivo mais descritivo
    const formattedDate = selectedDate.replace(/\//g, '-');
    XLSX.writeFile(wb, `Historico_Atendimentos_${formattedDate}.xlsx`);
  };

  const groupedHistory = groupByAttendant(history);

  return (
    <>
      <div className="flex items-center gap-2">
        <Input
          type="text"
          placeholder="DD/MM/YYYY"
          value={selectedDate}
          onChange={(e) => {
            const formatted = formatBrazilianDate(e.target.value);
            setSelectedDate(formatted);
          }}
          className="w-auto"
          maxLength={10}
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
              Histórico de Atendimentos - {selectedDate}
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