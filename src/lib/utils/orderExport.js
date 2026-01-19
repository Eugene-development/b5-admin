/**
 * Утилита для экспорта заказа в различные форматы
 * Все функции выполняются только на клиенте
 */

// Форматирование даты
function formatDate(dateString) {
	if (!dateString) return 'Не указана';
	return new Date(dateString).toLocaleDateString('ru-RU', {
		day: 'numeric',
		month: 'long',
		year: 'numeric'
	});
}

// Форматирование валюты
function formatCurrency(amount) {
	if (amount === null || amount === undefined) return '—';
	return new Intl.NumberFormat('ru-RU', {
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(amount);
}

/**
 * Экспорт заказа в PDF через окно печати браузера
 */
export async function exportToPDF(order) {
	// Создаем HTML для печати
	const html = generatePrintHTML(order);
	
	// Открываем новое окно
	const printWindow = window.open('', '_blank', 'width=900,height=700');
	if (!printWindow) {
		throw new Error('Не удалось открыть окно. Проверьте настройки блокировки всплывающих окон.');
	}
	
	printWindow.document.write(html);
	printWindow.document.close();
}

/**
 * Генерация HTML для печати
 */
function generatePrintHTML(order) {
	const positionsHTML = order.positions && order.positions.length > 0
		? `
			<h3>Позиции заказа</h3>
			<table>
				<thead>
					<tr>
						<th>№</th>
						<th>Наименование</th>
						<th>Артикул</th>
						<th style="text-align: right;">Цена</th>
						<th style="text-align: center;">Кол-во</th>
						<th style="text-align: right;">Сумма</th>
					</tr>
				</thead>
				<tbody>
					${order.positions.map((pos, index) => `
						<tr>
							<td>${index + 1}</td>
							<td>${pos.value || '—'}</td>
							<td>${pos.article || '—'}</td>
							<td style="text-align: right;">${formatCurrency(pos.price)}</td>
							<td style="text-align: center;">${pos.count || 0}</td>
							<td style="text-align: right;">${formatCurrency(pos.total_price)}</td>
						</tr>
					`).join('')}
				</tbody>
				<tfoot>
					<tr>
						<td colspan="5" style="text-align: right;"><strong>Итого:</strong></td>
						<td style="text-align: right;"><strong>${formatCurrency(order.positions.reduce((sum, p) => sum + (p.total_price || 0), 0))}</strong></td>
					</tr>
				</tfoot>
			</table>
		`
		: '';

	const commentHTML = order.comments && order.comments.length > 0
		? `<p><strong>Комментарий:</strong> ${order.comments[0].value || ''}</p>`
		: '';

	return `
		<!DOCTYPE html>
		<html lang="ru">
		<head>
			<meta charset="UTF-8">
			<title>Заказ № ${order.order_number || 'Без номера'}</title>
			<style>
				* { margin: 0; padding: 0; box-sizing: border-box; }
				body { 
					font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; 
					padding: 20px;
					font-size: 14px;
					line-height: 1.5;
				}
				h1 { font-size: 24px; margin-bottom: 20px; color: #1a1a1a; }
				h3 { font-size: 16px; margin: 20px 0 10px; color: #333; }
				p { margin: 8px 0; color: #444; }
				table { 
					width: 100%; 
					border-collapse: collapse; 
					margin: 15px 0;
				}
				th, td { 
					border: 1px solid #ddd; 
					padding: 10px 12px; 
					text-align: left;
				}
				th { 
					background: #f5f5f5; 
					font-weight: 600;
					font-size: 13px;
				}
				tfoot td { 
					background: #f9f9f9; 
					font-weight: 500;
				}
				.info-row { margin: 6px 0; }
				.info-label { font-weight: 600; display: inline-block; min-width: 150px; }
				@media print {
					body { padding: 0; }
					button { display: none; }
				}
			</style>
		</head>
		<body>
			<h1>Заказ № ${order.order_number || 'Без номера'}</h1>
			
			<div class="info-row"><span class="info-label">Поставщик:</span> ${order.company?.name || '—'}</div>
			${order.company?.legal_name ? `<div class="info-row"><span class="info-label">Юр. наименование:</span> ${order.company.legal_name}</div>` : ''}
			<div class="info-row"><span class="info-label">Проект:</span> ${order.project?.project_number || '—'}</div>
			${order.project?.region ? `<div class="info-row"><span class="info-label">Регион:</span> ${order.project.region}</div>` : ''}
			<div class="info-row"><span class="info-label">Дата создания:</span> ${formatDate(order.created_at)}</div>
			<div class="info-row"><span class="info-label">Статус:</span> ${order.is_active ? 'Активен' : 'Неактивен'}</div>
			<div class="info-row"><span class="info-label">Сумма заказа:</span> ${formatCurrency(order.order_amount)}</div>
			
			${positionsHTML}
			${commentHTML}
		</body>
		</html>
	`;
}

/**
 * Экспорт заказа в Excel
 */
export async function exportToExcel(order) {
	// Динамический импорт только на клиенте
	const XLSX = await import('xlsx');
	
	const wb = XLSX.utils.book_new();
	
	// Данные заказа
	const orderInfo = [
		['Заказ №', order.order_number || 'Без номера'],
		[''],
		['Поставщик', order.company?.name || '—'],
		['Юр. наименование', order.company?.legal_name || '—'],
		['Проект', order.project?.project_number || '—'],
		['Регион', order.project?.region || '—'],
		['Дата создания', formatDate(order.created_at)],
		['Статус', order.is_active ? 'Активен' : 'Неактивен'],
		['Сумма заказа', order.order_amount || 0],
		['']
	];
	
	// Добавляем заголовок позиций
	orderInfo.push(['Позиции заказа']);
	orderInfo.push(['№', 'Наименование', 'Артикул', 'Цена', 'Количество', 'Сумма']);
	
	// Добавляем позиции
	if (order.positions && order.positions.length > 0) {
		order.positions.forEach((pos, index) => {
			orderInfo.push([
				index + 1,
				pos.value || '—',
				pos.article || '—',
				pos.price || 0,
				pos.count || 0,
				pos.total_price || 0
			]);
		});
		
		// Итого
		const totalSum = order.positions.reduce((sum, p) => sum + (p.total_price || 0), 0);
		orderInfo.push(['', '', '', '', 'Итого:', totalSum]);
	}
	
	// Комментарий
	if (order.comments && order.comments.length > 0) {
		orderInfo.push(['']);
		orderInfo.push(['Комментарий', order.comments[0].value || '']);
	}
	
	const ws = XLSX.utils.aoa_to_sheet(orderInfo);
	
	// Устанавливаем ширину колонок
	ws['!cols'] = [
		{ wch: 5 },
		{ wch: 40 },
		{ wch: 20 },
		{ wch: 15 },
		{ wch: 12 },
		{ wch: 15 }
	];
	
	XLSX.utils.book_append_sheet(wb, ws, 'Заказ');
	XLSX.writeFile(wb, `Заказ_${order.order_number || order.id}.xlsx`);
}

/**
 * Экспорт заказа в Word
 */
export async function exportToWord(order) {
	// Динамический импорт только на клиенте
	const docx = await import('docx');
	const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, TextRun } = docx;
	
	const children = [];
	
	// Заголовок
	children.push(
		new Paragraph({
			children: [
				new TextRun({
					text: `Заказ № ${order.order_number || 'Без номера'}`,
					bold: true,
					size: 36
				})
			],
			spacing: { after: 400 }
		})
	);
	
	// Информация о заказе
	const infoData = [
		['Поставщик', order.company?.name || '—'],
		['Юр. наименование', order.company?.legal_name || '—'],
		['Проект', order.project?.project_number || '—'],
		['Регион', order.project?.region || '—'],
		['Дата создания', formatDate(order.created_at)],
		['Статус', order.is_active ? 'Активен' : 'Неактивен'],
		['Сумма заказа', formatCurrency(order.order_amount)]
	];
	
	infoData.forEach(([label, value]) => {
		children.push(
			new Paragraph({
				children: [
					new TextRun({ text: `${label}: `, bold: true, size: 24 }),
					new TextRun({ text: value, size: 24 })
				],
				spacing: { after: 100 }
			})
		);
	});
	
	// Позиции заказа
	if (order.positions && order.positions.length > 0) {
		children.push(
			new Paragraph({
				children: [
					new TextRun({ text: 'Позиции заказа', bold: true, size: 28 })
				],
				spacing: { before: 400, after: 200 }
			})
		);
		
		// Таблица позиций
		const tableRows = [];
		
		// Заголовок таблицы
		tableRows.push(
			new TableRow({
				children: [
					new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: '№', bold: true })] })], width: { size: 5, type: WidthType.PERCENTAGE } }),
					new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Наименование', bold: true })] })], width: { size: 40, type: WidthType.PERCENTAGE } }),
					new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Артикул', bold: true })] })], width: { size: 15, type: WidthType.PERCENTAGE } }),
					new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Цена', bold: true })] })], width: { size: 15, type: WidthType.PERCENTAGE } }),
					new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Кол-во', bold: true })] })], width: { size: 10, type: WidthType.PERCENTAGE } }),
					new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Сумма', bold: true })] })], width: { size: 15, type: WidthType.PERCENTAGE } })
				]
			})
		);
		
		// Строки с позициями
		order.positions.forEach((pos, index) => {
			tableRows.push(
				new TableRow({
					children: [
						new TableCell({ children: [new Paragraph({ text: String(index + 1) })] }),
						new TableCell({ children: [new Paragraph({ text: pos.value || '—' })] }),
						new TableCell({ children: [new Paragraph({ text: pos.article || '—' })] }),
						new TableCell({ children: [new Paragraph({ text: formatCurrency(pos.price) })] }),
						new TableCell({ children: [new Paragraph({ text: String(pos.count || 0) })] }),
						new TableCell({ children: [new Paragraph({ text: formatCurrency(pos.total_price) })] })
					]
				})
			);
		});
		
		// Итого
		const totalSum = order.positions.reduce((sum, p) => sum + (p.total_price || 0), 0);
		tableRows.push(
			new TableRow({
				children: [
					new TableCell({ children: [new Paragraph({ text: '' })] }),
					new TableCell({ children: [new Paragraph({ text: '' })] }),
					new TableCell({ children: [new Paragraph({ text: '' })] }),
					new TableCell({ children: [new Paragraph({ text: '' })] }),
					new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: 'Итого:', bold: true })] })] }),
					new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: formatCurrency(totalSum), bold: true })] })] })
				]
			})
		);
		
		children.push(
			new Table({
				rows: tableRows,
				width: { size: 100, type: WidthType.PERCENTAGE }
			})
		);
	}
	
	// Комментарий
	if (order.comments && order.comments.length > 0) {
		children.push(
			new Paragraph({
				children: [
					new TextRun({ text: 'Комментарий:', bold: true, size: 24 })
				],
				spacing: { before: 400, after: 100 }
			})
		);
		children.push(
			new Paragraph({
				children: [
					new TextRun({ text: order.comments[0].value || '', size: 22 })
				]
			})
		);
	}
	
	const doc = new Document({
		sections: [{
			properties: {},
			children: children
		}]
	});
	
	const blob = await Packer.toBlob(doc);
	
	// Скачиваем файл через создание ссылки
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = `Заказ_${order.order_number || order.id}.docx`;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

/**
 * Экспорт заказа в указанный формат
 */
export async function exportOrder(order, format) {
	// Проверка что мы на клиенте
	if (typeof window === 'undefined') {
		console.error('Экспорт возможен только на клиенте');
		return;
	}
	
	switch (format) {
		case 'pdf':
			await exportToPDF(order);
			break;
		case 'excel':
			await exportToExcel(order);
			break;
		case 'word':
			await exportToWord(order);
			break;
		default:
			console.error('Неизвестный формат:', format);
	}
}
