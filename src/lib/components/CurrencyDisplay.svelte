<script>
	import { formatCurrency, formatAgentRate } from '../utils/formatters.js';

	let {
		amount = null,
		currency = 'RUB',
		type = 'currency', // 'currency' | 'agent_rate'
		rateType = 'percentage', // for agent_rate type
		className = '',
		size = 'normal' // 'small' | 'normal' | 'large'
	} = $props();

	let formattedValue = $derived(
		type === 'agent_rate' ? formatAgentRate(amount, rateType) : formatCurrency(amount, currency)
	);

	let sizeClasses = $derived(
		{
			small: 'text-sm',
			normal: 'text-base',
			large: 'text-lg font-semibold'
		}[size]
	);

	let isZeroOrEmpty = $derived(!amount || amount === 0);
</script>

<span
	class="inline-block {sizeClasses} {className}"
	class:text-gray-500={isZeroOrEmpty}
	class:font-medium={!isZeroOrEmpty && type === 'currency'}
>
	{formattedValue}
</span>
