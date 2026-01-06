import React from 'react';
import { BottomSheet } from '../ui/BottomSheet';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Пользовательское соглашение">
      <div className="space-y-8 text-white/80 text-base leading-relaxed">
        {/* 1. Условия использования */}
        <section className="space-y-3 css-dialog_content-item" style={{ '--index': 1 } as React.CSSProperties}>
          <h3 className="text-lg font-medium text-white">Условия использования</h3>
          <p>
            Используя сервис <strong className="text-white">Outlivion</strong>, вы подтверждаете согласие с настоящими условиями и обязуетесь использовать сервис в соответствии с действующим законодательством страны вашего пребывания.
          </p>
        </section>

        <div className="h-px bg-white/5 css-dialog_content-item" style={{ '--index': 1.5 } as React.CSSProperties} />

        {/* 2. О сервисе Outlivion */}
        <section className="space-y-3 css-dialog_content-item" style={{ '--index': 2 } as React.CSSProperties}>
          <h3 className="text-lg font-medium text-white">О сервисе Outlivion</h3>
          <p>
            Outlivion — это сервис защищённого сетевого подключения, предназначенный для повышения конфиденциальности и безопасности интернет-соединения.
          </p>
          <p>
            Сервис использует современные методы шифрования и маршрутизации трафика для защиты данных пользователя. Outlivion не изменяет, не анализирует и не вмешивается в содержимое пользовательского трафика.
          </p>
        </section>

        <div className="h-px bg-white/5 css-dialog_content-item" style={{ '--index': 2.5 } as React.CSSProperties} />

        {/* 3. Демо-доступ */}
        <section className="space-y-3 css-dialog_content-item" style={{ '--index': 3 } as React.CSSProperties}>
          <h3 className="text-lg font-medium text-white">Демо-доступ</h3>
          <p>
            Новым пользователям может быть предоставлен демо-доступ к сервису. Срок демо-периода начинается с момента первой авторизации и отображается в интерфейсе приложения.
          </p>
        </section>

        <div className="h-px bg-white/5 css-dialog_content-item" style={{ '--index': 3.5 } as React.CSSProperties} />

        {/* 4. Подписка и продление */}
        <section className="space-y-3 css-dialog_content-item" style={{ '--index': 4 } as React.CSSProperties}>
          <h3 className="text-lg font-medium text-white">Подписка и продление</h3>
          <p>
            Доступ к сервису предоставляется по подписке. При оплате подписки может быть включено автоматическое продление. Дата окончания текущего периода всегда отображается в приложении.
          </p>
          <p>
            Автоматическое продление можно отключить в разделе <strong className="text-white">«Профиль» → «Оплата»</strong>.
          </p>
        </section>

        <div className="h-px bg-white/5 css-dialog_content-item" style={{ '--index': 4.5 } as React.CSSProperties} />

        {/* 5. Использование сервиса */}
        <section className="space-y-3 css-dialog_content-item" style={{ '--index': 5 } as React.CSSProperties}>
          <h3 className="text-lg font-medium text-white">Использование сервиса</h3>
          <p>
            Подписка предоставляет право использования сервиса на ограниченном количестве устройств в рамках выбранного тарифа.
          </p>
          <p>
            Использование одной подписки на большем количестве устройств, чем предусмотрено тарифом, может привести к временному ограничению доступа до устранения нарушения.
          </p>
        </section>

        <div className="h-px bg-white/5 css-dialog_content-item" style={{ '--index': 5.5 } as React.CSSProperties} />

        {/* 6. Изменение условий и стоимости */}
        <section className="space-y-3 css-dialog_content-item" style={{ '--index': 6 } as React.CSSProperties}>
          <h3 className="text-lg font-medium text-white">Изменение условий и стоимости</h3>
          <p>
            Мы оставляем за собой право изменять условия предоставления сервиса и стоимость подписки.
          </p>
          <p>
            В случае значительных изменений пользователи уведомляются заранее. Новые условия вступают в силу с начала следующего платёжного периода.
          </p>
        </section>

        <div className="h-px bg-white/5 css-dialog_content-item" style={{ '--index': 6.5 } as React.CSSProperties} />

        {/* 7. Политика возврата */}
        <section className="space-y-3 css-dialog_content-item" style={{ '--index': 7 } as React.CSSProperties}>
          <h3 className="text-lg font-medium text-white">Политика возврата</h3>
          <p>
            Вы можете обратиться в службу поддержки с запросом на возврат средств, если сервис был недоступен или предоставлен с существенными ограничениями.
          </p>
          <p>
            Каждый запрос рассматривается индивидуально. Срок возврата средств зависит от используемого платёжного метода.
          </p>
        </section>

        <div className="h-px bg-white/5 css-dialog_content-item" style={{ '--index': 7.5 } as React.CSSProperties} />

        {/* 8. Конфиденциальность и данные */}
        <section className="space-y-3 css-dialog_content-item" style={{ '--index': 8 } as React.CSSProperties}>
          <h3 className="text-lg font-medium text-white">Конфиденциальность и данные</h3>
          <p>
            Outlivion не собирает и не хранит данные о посещаемых сайтах, содержимом трафика или действиях пользователей в сети.
          </p>
          <p>
            Мы применяем технические и организационные меры для защиты информации и обеспечения безопасности соединения.
          </p>
        </section>

        <div className="h-px bg-white/5 css-dialog_content-item" style={{ '--index': 8.5 } as React.CSSProperties} />

        {/* 9. Отказ от ответственности */}
        <section className="space-y-3 css-dialog_content-item" style={{ '--index': 9 } as React.CSSProperties}>
          <h3 className="text-lg font-medium text-white">Отказ от ответственности</h3>
          <p>
            Мы стремимся обеспечивать стабильную работу сервиса, однако не гарантируем его бесперебойную доступность в любой момент времени.
          </p>
          <p>
            Сервис предоставляется «как есть» и «по мере доступности». Пользователь самостоятельно несёт ответственность за использование сервиса и соблюдение применимого законодательства.
          </p>
        </section>
      </div>
    </BottomSheet>
  );
};
