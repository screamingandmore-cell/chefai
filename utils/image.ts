
/**
 * Comprime uma imagem selecionada pelo usuário para evitar Payload Too Large.
 * Redimensiona para max 800x800 e converte para JPEG 70%.
 */
export const compressImage = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        
        let width = img.width;
        let height = img.height;

        // Mantém a proporção
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error("Não foi possível criar contexto do canvas"));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Retorna Base64 comprimido (JPEG 70%)
        // Isso reduz uma foto de 5MB para ~100kb
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      
      img.onerror = (err) => reject(err);
    };
    
    reader.onerror = (err) => reject(err);
  });
};
