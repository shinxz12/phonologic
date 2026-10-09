import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReadingSummary } from '@phonologic/shared-types';
import { Card, Badge, Button, ProgressBar, Icon, TextField } from '../../components';
import { AddReadingModal } from './components/AddReadingModal';

export interface ReadingLibraryProps {
  readings: ReadingSummary[];
  admin?: boolean;
  onOpen: (id: string) => void;
}

export function ReadingLibrary({ readings, admin = false, onOpen }: ReadingLibraryProps) {
  const { t } = useTranslation();
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedAccent, setSelectedAccent] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  // Extract unique levels from readings
  const availableLevels = useMemo(() => {
    const set = new Set<string>();
    readings.forEach((r) => {
      if (r.level) set.add(r.level);
    });
    return Array.from(set).sort();
  }, [readings]);

  // Filtered readings list
  const filteredReadings = useMemo(() => {
    return readings.filter((r) => {
      // Search text match
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = r.title.toLowerCase().includes(q);
        const matchesDesc = r.description.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc) return false;
      }

      // Level filter
      if (selectedLevel !== 'all' && r.level !== selectedLevel) {
        return false;
      }

      // Accent filter
      if (selectedAccent !== 'all' && r.accent !== selectedAccent) {
        return false;
      }

      // Status filter
      if (selectedStatus === 'completed' && !r.completed) {
        return false;
      }
      if (selectedStatus === 'in_progress' && (r.completed || r.completedTargets === 0)) {
        return false;
      }
      if (selectedStatus === 'not_started' && r.completedTargets > 0) {
        return false;
      }

      return true;
    });
  }, [readings, searchQuery, selectedLevel, selectedAccent, selectedStatus]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedLevel('all');
    setSelectedAccent('all');
    setSelectedStatus('all');
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8 flex flex-col gap-8 animate-in fade-in duration-200">
      {/* Header Banner matching Stitch ba669144 with Add Reading CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2 text-secondary">
            <Icon name="auto_stories" size={24} />
            <span className="font-display font-bold text-xs uppercase tracking-wider">
              {t('Thư Viện Bài Đọc & Ngữ Âm')}
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-on-surface tracking-tight">
            {t('Luyện Đọc Trong Ngữ Cảnh')}
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant max-w-2xl leading-relaxed">
            {t('Đọc truyện và đoạn văn thực tế để làm chủ các chùm chữ – âm mục tiêu, bóc tách cấu trúc từ vựng và luyện phát âm chuẩn xác.')}
          </p>
        </div>
        {admin && (
          <Button
            variant="primary"
            size="md"
            icon="add"
            onClick={() => setIsAddModalOpen(true)}
            className="shrink-0 self-start sm:self-auto font-bold shadow-xs"
          >
            {t('Thêm bài đọc')}
          </Button>
        )}
      </div>
      {/* Search and Filters Bar */}
      <div className="bg-surface-lowest p-5 rounded-2xl border border-outline-variant/30 flex flex-col gap-4 shadow-xs">
        {/* Search input */}
        <div className="w-full max-w-md">
          <TextField
            label={t('Tìm kiếm bài đọc')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('Tìm theo tiêu đề hoặc từ vựng ngữ âm...')}
            icon="search"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2.5 pt-2 border-t border-outline-variant/20">
          {/* Level Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-on-surface-variant font-medium mr-1">{t('Cấp độ:')}</span>
            <Button
              size="sm"
              variant={selectedLevel === 'all' ? 'secondary' : 'outline'}
              aria-pressed={selectedLevel === 'all'}
              onClick={() => setSelectedLevel('all')}
              className="min-h-8! h-8! px-2.5! text-xs!"
            >
              {t('Tất cả')}
            </Button>
            {availableLevels.map((lvl) => (
              <Button
                key={lvl}
                size="sm"
                variant={selectedLevel === lvl ? 'secondary' : 'outline'}
                aria-pressed={selectedLevel === lvl}
                onClick={() => setSelectedLevel(lvl)}
                className="min-h-8! h-8! px-2.5! text-xs!"
              >
                {t('Cấp {{level}}', { level: lvl })}
              </Button>
            ))}
          </div>

          <div className="hidden md:block w-px h-4 bg-outline-variant/40" />

          {/* Accent Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-on-surface-variant font-medium mr-1">{t('Giọng:')}</span>
            {(['all', 'US', 'UK'] as const).map((acc) => (
              <Button
                key={acc}
                size="sm"
                variant={selectedAccent === acc ? 'secondary' : 'outline'}
                aria-pressed={selectedAccent === acc}
                onClick={() => setSelectedAccent(acc)}
                className="min-h-8! h-8! px-2.5! text-xs!"
              >
                {acc === 'all' ? t('Tất cả') : acc}
              </Button>
            ))}
          </div>

          <div className="hidden md:block w-px h-4 bg-outline-variant/40" />

          {/* Status Filter */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-xs text-on-surface-variant font-medium mr-1">{t('Trạng thái:')}</span>
            {[
              { id: 'all', label: t('Tất cả') },
              { id: 'in_progress', label: t('Đang học') },
              { id: 'completed', label: t('Hoàn thành') },
            ].map((st) => (
              <Button
                key={st.id}
                size="sm"
                variant={selectedStatus === st.id ? 'secondary' : 'outline'}
                aria-pressed={selectedStatus === st.id}
                onClick={() => setSelectedStatus(st.id)}
                className="min-h-8! h-8! px-2.5! text-xs!"
              >
                {st.label}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Reading Cards Grid */}
      {readings.length === 0 ? (
        <Card tone="soft" className="p-12! text-center flex flex-col items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-surface-high text-on-surface-variant flex items-center justify-center">
            <Icon name="library_books" size={32} />
          </div>
          <h3 className="font-display font-bold text-lg text-on-surface">{t('Chưa có bài đọc nào')}</h3>
          <p className="text-sm text-on-surface-variant max-w-sm">
            {t('Nội dung bài đọc đang được ban biên tập xuất bản. Vui lòng quay lại sau.')}
          </p>
        </Card>
      ) : filteredReadings.length === 0 ? (
        <Card tone="soft" className="p-10! text-center flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-full bg-surface-high text-on-surface-variant flex items-center justify-center">
            <Icon name="search_off" size={28} />
          </div>
          <h3 className="font-display font-bold text-lg text-on-surface">{t('Không tìm thấy bài đọc phù hợp')}</h3>
          <p className="text-sm text-on-surface-variant max-w-sm">
            {t('Thử thay đổi từ khóa tìm kiếm hoặc đặt lại các tiêu chí bộ lọc.')}
          </p>
          <Button variant="outline" size="sm" onClick={handleResetFilters} className="mt-2">
            {t('Đặt lại bộ lọc')}
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReadings.map((reading) => {
            const hasStarted = reading.completedTargets > 0;
            const isCompleted = reading.completed;

            return (
              <Card
                key={reading.id}
                tone="white"
                className="overflow-hidden border border-outline-variant/30 flex flex-col justify-between hover:shadow-md transition-shadow group rounded-3xl"
              >
                {/* Thumbnail / Story Art Banner */}
                <div className="h-44 bg-surface-low relative overflow-hidden flex items-center justify-center">
                  {reading.imageUrl ? (
                    <img
                      src={reading.imageUrl}
                      alt={reading.title}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-on-surface-variant/50 gap-2">
                      <Icon name="menu_book" size={48} />
                      <span className="font-display text-xs font-bold uppercase tracking-wider">
                        {t('Truyện đọc ngữ âm')}
                      </span>
                    </div>
                  )}

                  {/* Top floating badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-1.5">
                    <Badge tone="blue">{t('Cấp {{level}}', { level: reading.level })}</Badge>
                    <Badge tone="neutral">{reading.accent}</Badge>
                  </div>

                  {/* Completed Ribbon if finished */}
                  {isCompleted && (
                    <div className="absolute top-3 right-3">
                      <Badge tone="green" icon="check_circle">
                        {t('Hoàn thành')}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col gap-3">
                  <h3 className="font-display text-lg font-bold text-on-surface tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                    {reading.title}
                  </h3>

                  <p className="text-xs text-on-surface-variant line-clamp-2 leading-relaxed">
                    {reading.description}
                  </p>

                  {/* Target Words Practice Progress */}
                  <div className="mt-auto pt-3 flex flex-col gap-1.5 border-t border-outline-variant/20">
                    <div className="flex items-center justify-between text-xs text-on-surface-variant">
                      <span>{t('Tiến độ từ mục tiêu:')}</span>
                      <strong className="text-on-surface">
                        {t('{{completed}}/{{total}} từ', {
                          completed: reading.completedTargets,
                          total: reading.targetCount,
                        })}
                      </strong>
                    </div>
                    <ProgressBar
                      value={reading.completedTargets}
                      max={reading.targetCount}
                      label={t('Tiến độ {{completed}}/{{total}} từ mục tiêu', {
                        completed: reading.completedTargets,
                        total: reading.targetCount,
                      })}
                    />
                  </div>
                </div>

                {/* Card Footer Action */}
                <div className="px-5 pb-5 pt-1">
                  <Button
                    variant={isCompleted ? 'secondary' : 'primary'}
                    size="md"
                    onClick={() => onOpen(reading.id)}
                    className="w-full justify-center"
                  >
                    <Icon name={isCompleted ? 'refresh' : hasStarted ? 'arrow_forward' : 'play_arrow'} size={18} />
                    {isCompleted
                      ? t('Đọc lại bài')
                      : hasStarted
                      ? t('Tiếp tục luyện tập')
                      : t('Bắt đầu đọc')}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Reading Modal */}
      <AddReadingModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
    </div>
  );
}
