FROM php:5.6.40-apache

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Bangkok

RUN \
    echo "deb http://archive.debian.org/debian/ stretch main contrib non-free" > /etc/apt/sources.list \
    && echo "deb http://archive.debian.org/debian-security stretch/updates main contrib non-free" >> /etc/apt/sources.list \
    && apt-get update -o Acquire::Check-Valid-Until=false \
    && apt-get install -y --no-install-recommends \
        default-mysql-client \
        libmariadbclient-dev \
        tzdata \
    && echo "${TZ}" > /etc/timezone \
    && dpkg-reconfigure -f noninteractive tzdata \
    && a2enmod rewrite \
    && echo "ServerName localhost" > /etc/apache2/conf-available/fqdn.conf \
    && a2enconf fqdn \
    && rm -rf /var/lib/apt/lists/*

RUN docker-php-ext-configure pdo_mysql --with-pdo-mysql=mysqlnd \
    && docker-php-ext-install -j$(nproc) \
        pdo \
        pdo_mysql \
        mysqli

COPY --chown=www-data:www-data . /var/www/html/

WORKDIR /var/www/html

# หมายเหตุสำคัญ: PHP 5.6.40 สิ้นสุดการสนับสนุน (End of Life) ไปตั้งแต่เดือนมกราคม 2019
# และมีช่องโหว่ความปลอดภัยที่ทราบแล้ว การใช้งานใน Production ไม่แนะนำอย่างยิ่ง
# หากเป็นไปได้ ควรอัปเกรดเป็น PHP เวอร์ชันที่ยังได้รับการสนับสนุน