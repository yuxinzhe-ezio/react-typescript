import React from 'react';

import styles from './style.module.scss';

type BrandTitleProps = {
  text?: string;
  className?: string;
};

const BrandTitle: React.FC<BrandTitleProps> = ({ text = 'Pornhub', className }) => {
  return (
    <div className={`${styles.brandTitle}${className ? ` ${className}` : ''}`}>
      <span className={styles.brandLeft}>Porn</span>
      <span className={styles.brandRight}>hub</span>
      {text && text !== 'Pornhub' ? <span className={styles.brandSuffix}>{text}</span> : null}
    </div>
  );
};

export default BrandTitle;



