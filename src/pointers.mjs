const hasOwnProperty = Object.prototype.hasOwnProperty;
const decodeMap =
{
	'0' : '~',
	'1' : '/'
};

function hex(charCode)
{
	if (charCode >= 48 && charCode <= 57) // '0' = 48, '9' = 57
	{
		return charCode - 48;
	}

	if (charCode >= 97 && charCode <= 102) // 'a' = 97, 'f' = 102
	{
		return charCode - 87;
	}

	if (charCode >= 65 && charCode <= 70) // 'A' = 65, 'F' = 70
	{
		return charCode - 55;
	}

	throw new Error('invalid hexadecimal value');
}

function isNumber(charCode)
{
	return charCode >= 48 && charCode <= 57; // '0' = 48, '9' = 57
}

function decode(str)
{
	const length = str.length;
	const push = sequence =>
	{
		result += anchor === offset ? sequence : str.slice(anchor, offset) + sequence;
	};

	let anchor = 0;
	let offset = 0;
	let result = '';
	let isNumeric = true;

	while (offset < length)
	{
		const charCode = str.charCodeAt(offset);
		if (charCode === 126) // '~' = 126
		{
			const ctrl = offset + 1;
			const char = ctrl < length && decodeMap[str[ctrl]];
			if (!char)
			{
				throw new Error('invalid tilda sequence');
			}

			push(char);
			offset = ctrl;
			anchor = offset + 1;
		}
		else if (charCode === 37) // '%' = 37
		{
			if (offset + 2 >= length)
			{
				throw new Error('invalid percent sequence');
			}

			push(String.fromCharCode((hex(str.charCodeAt(offset + 1)) << 4) | hex(str.charCodeAt(offset + 2))));
			offset += 2;
			anchor = offset + 1;
		}
		else if (charCode === 43) // '+' = 43
		{
			push(' ');
			anchor = offset + 1;
		}

		isNumeric = isNumeric && isNumber(charCode);
		++offset;
	}

	if (anchor !== length)
	{
		result += str.slice(anchor);
	}

	return isNumeric ? Number(result) : result;
}

export function unrefPtr(root, pointerStr)
{
	const length = pointerStr.length;

	// first character is always a slash
	let anchor = 1;
	let index = 1;

	// parse & traverse the structure
	while (index <= length)
	{
		if (index === length || pointerStr[index] === '/')
		{
			if (anchor !== index)
			{
				const segment = decode(pointerStr.slice(anchor, index));
				if (!(root && typeof root === 'object' && (
					typeof segment === 'number' && Array.isArray(root)
						? segment < root.length
						: hasOwnProperty.call(root, segment)
				)))
				{
					throw new Error('could not dereference the pointer');
				}
				root = root[segment];
			}
			anchor = index + 1;
		}
		++index;
	}

	return root;
}

export function unrefId(root, id)
{
	if (root && typeof root === 'object')
	{
		if (root.$id && root.$id === id)
		{
			return root;
		}

		if (Array.isArray(root))
		{
			const length = root.length;
			for (let i = 0; i < length; ++i)
			{
				const tmp = unrefId(root[i], id);
				if (tmp !== undefined)
				{
					return tmp;
				}
			}
		}
		else
		{
			for (const key in root)
			{
				const tmp = unrefId(root[key], id);
				if (tmp !== undefined)
				{
					return tmp;
				}
			}
		}
	}
}
