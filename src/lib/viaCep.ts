export interface ViaCepResponse {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  gia: string;
  ddd: string;
  siafi: string;
  erro?: boolean;
}

const VIACEP_BASE = 'https://viacep.com.br/ws';

export const searchCep = async (cep: string): Promise<ViaCepResponse | null> => {
  try {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      throw new Error('CEP deve ter 8 dígitos');
    }

    const response = await fetch(`${VIACEP_BASE}/${cleanCep}/json/`);
    
    if (!response.ok) {
      throw new Error('Erro ao buscar CEP');
    }

    const data = await response.json();

    if (data.erro) {
      throw new Error('CEP não encontrado');
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar CEP:', error);
    return null;
  }
};

export const formatAddress = (data: ViaCepResponse): string => {
  const parts = [
    data.logradouro,
    data.bairro,
    data.localidade,
    data.uf
  ].filter(Boolean);
  
  return parts.join(', ');
};

export const formatCepMask = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length <= 5) {
    return cleaned;
  }
  return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
};