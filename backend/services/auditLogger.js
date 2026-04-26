function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];
  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || null;
}

async function logAudit(pool, req, entry) {
  try {
    const userId = entry.usuarioId || req.user?.id;
    if (!userId) {
      return;
    }

    await pool.query(
      `
        INSERT INTO bitacora_auditoria (
          usuario_id,
          accion,
          nombre_tabla,
          id_registro_afectado,
          valor_anterior,
          valor_nuevo,
          direccion_ip
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `,
      [
        userId,
        entry.accion,
        entry.nombreTabla,
        entry.idRegistroAfectado ? String(entry.idRegistroAfectado) : null,
        entry.valorAnterior ? JSON.stringify(entry.valorAnterior) : null,
        entry.valorNuevo ? JSON.stringify(entry.valorNuevo) : null,
        getClientIp(req)
      ]
    );
  } catch (error) {
    console.error('Error registrando auditoria:', error.message);
  }
}

module.exports = { logAudit };
