package com.bookstore.api.repository;

import com.bookstore.api.entity.UserFavoriteCategory;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserFavoriteCategoryRepository extends JpaRepository<UserFavoriteCategory, Long> {

    List<UserFavoriteCategory> findByUserId(Long userId);

    @Query("SELECT ufc.category.id FROM UserFavoriteCategory ufc WHERE ufc.user.id = :userId")
    List<Long> findCategoryIdsByUserId(@Param("userId") Long userId);

    @Modifying
    @Query("DELETE FROM UserFavoriteCategory ufc WHERE ufc.user.id = :userId")
    void deleteByUserId(@Param("userId") Long userId);

    boolean existsByUserIdAndCategoryId(Long userId, Long categoryId);

    /** [tên thể loại, số khách chọn] — giảm dần. */
    @Query("SELECT ufc.category.name, COUNT(ufc) FROM UserFavoriteCategory ufc GROUP BY ufc.category.id, ufc.category.name ORDER BY COUNT(ufc) DESC")
    List<Object[]> countByCategory(Pageable pageable);
}
