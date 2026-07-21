<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?= htmlspecialchars($tituloPagina ?? 'La Morán', ENT_QUOTES, 'UTF-8') ?></title>
    <link rel="stylesheet" href="/Proyecto-Moran/vistas/Recursos/estilos.css">
    <?php if (isset($cssPagina)): ?>
        <link rel="stylesheet" href="/Proyecto-Moran/vistas/Recursos/<?= htmlspecialchars($cssPagina, ENT_QUOTES, 'UTF-8') ?>">
    <?php endif; ?>
</head>
