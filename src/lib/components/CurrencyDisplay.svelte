<script>
	import { formatCurrency, formatAgentRate } from '../utils/formatters.js';

	export let amount = null;
	export let currency = 'RUB';
	export let type = 'currency'; // 'currency' | 'agent_rate'
	export let rateType = 'percentage'; // for agent_rate type
	export let className = '';
	export let size = 'normal'; // 'small' | 'normal' | 'large'

	$: formattedValue = type === 'agent_rate' 
		? formatAgentRate(amount, rateType)
		: formatCurrency(amount, currency);

	$: sizeClasses = {
		small: 'text-sm',
		normal: 'text-base',
		large: 'text-lg font-semibold'
	}[size];

	$: isZeroOrEmpty = !amount || amount === 0;
</script>

<span 
	class="inline-block {sizeClasses} {className}"
	class:text-gray-500={isZeroOrEmpty}
	class:font-medium={!isZeroOrEmpty && type === 'currency'}
>
	{formattedValue}
</span>